import { parse } from "svelte/compiler"
import type { ZodSchema, ZodString } from "zod"

// export type SafeParseSuccess<Output> = {
// 	success: true;
// 	data: Output;
// 	error?: never;
// };
// export type SafeParseError<Input> = {
// 	success: false;
// 	error: ZodError<Input>;
// 	data?: never;
// };

type ListenerFunction = (field: FormField) => void

interface ValidationErrorObject {
	name: string
	message: string
}
type ValidationResult = ValidationErrorObject[] | null
type ValidationTriggers = 'onblur' | 'onchange' | 'onfocus' | 'oninput' | 'onmount'
type ValidatorFunction = (field: FormField) => ValidationResult
type ValidatorFormOption = ValidatorFunction | ZodString
type ValidationFormOption = {
	triggers?: ValidationTriggers[]
	validator: ValidatorFormOption
}

interface FieldFormOption {
	default?: string
	listeners?: {
		onBlur?: ListenerFunction
		onChange?: ListenerFunction
		onFocus?: ListenerFunction
		onInput?: ListenerFunction
	}
	validator?: ValidatorFormOption
	validation?: ValidationFormOption
}

interface FieldsFormOption {
	[propName: string]: FieldFormOption
}

export interface FormOptions {
	fields: FieldsFormOption
	onReset?: (event: Event | null, form: Form) => void
	onSubmit?: (event: Event | null, form: Form) => void
}

interface FormFields {
	[propName: string]: FormField
}

interface FormField {
	isChanged: boolean
	isDirty: boolean
	isTouched: boolean
	name: string
	error: string | null
	errors: ValidationErrorObject[] | null
	value: string | null
}

class Form {
	readonly options: FormOptions
	readonly fields = $state<FormFields>({})
	readonly errors: ValidationErrorObject[] = $derived.by<ValidationErrorObject[]>(() => {
		let errors: ValidationErrorObject[] = []
		Object.keys(this.fields).forEach((key) => {
			if (this.fields[key].errors) {
				this.fields[key].errors.forEach((error) => {
					errors.push(error)
				})
			}
		})
		return errors
	})
	readonly hasErrors = $derived(this.errors.length > 0)

	constructor(options: FormOptions) {
		this.options = options
		this.fields = this.createFormFields(options)
	}

	createFormFields(options: FormOptions): FormFields {
		let fields: FormFields = {}

		Object.keys(options.fields).forEach((key: keyof typeof options.fields) => {
			fields[key] = this.createFormField(key as string, options.fields[key])

			if (options.fields[key].validation?.triggers?.includes('onmount')) {
				this.validate(fields[key])
			}
		})

		return fields
	}

	createFormField(name: string, option: FieldFormOption): FormField {
		return {
			isChanged: false,
			isDirty: false,
			isTouched: false,
			error: null,
			errors: null,
			name: name,
			value: option.default ?? null
		}
	}

	handleBlurEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		if (options.validation?.triggers?.includes('onblur')) {
			this.validate(field)
		}

		options.listeners?.onBlur?.(field)
	}

	handleChangeEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		if (options.validation?.triggers?.includes('onchange')) {
			this.validate(field)
		}

		options.listeners?.onChange?.(field)
	}

	handleFocusEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		field.isTouched = true

		if (options.validation?.triggers?.includes('onfocus')) {
			this.validate(field)
		}

		options.listeners?.onFocus?.(field)
	}

	handleInputEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		field.isDirty = true
		field.isChanged = field.value !== options.default

		if (options.validation?.triggers?.includes('oninput')) {
			this.validate(field)
		}

		options.listeners?.onInput?.(field)
	}

	reset(): void {
		Object.keys(this.fields).forEach((key) => {
			if (this.options.fields[key]) {
				this.fields[key] = this.createFormField(key as string, this.options.fields[key])
			}
		})
	}

	validate(field: FormField): ValidationResult {
		let result: ValidationResult = null
		let validator = null

		// Get validator
		if (this.options.fields[field.name]?.validation) {
			validator = this.options.fields[field.name]?.validation?.validator
		}
		else if (this.options.fields[field.name]?.validator) {
			validator = this.options.fields[field.name]?.validator
		}

		// Validate
		if (validator && typeof validator === 'function') {
			result = validator(field)
		}
		else if (validator) {
			const schema = validator as ZodSchema
			const parseResult = schema.safeParse(field.value)
			result = parseResult.success ? null : parseResult.error.errors.map((error) => {
				return {
					name: field.name,
					message: error.message
			}})
		}

		// Set errors
		field.error = result ? result.map((error) => error.message).join('|') : null
		field.errors = result

		console.log(`Validating field: ${field.name} > ${field.error}`)
	
		return result
	}

	validateForm() {
		console.log("Validating form")

		Object.keys(this.fields).forEach((key) => {
			if (this.options.fields[key]) {
				this.validate(this.fields[key])
			}
		})
	}
}

export function createForm(options: FormOptions): Form {
	return new Form(options)
}

export function formify(node: HTMLFormElement, form: Form) {
	const inputs = node.querySelectorAll('input')

	function handleResetEvent(event: Event, callback: FormOptions['onReset']) {
		event.preventDefault()
		if (callback) {
			callback(event, form)
			form.reset()
		}
		else {
			form.reset()
		}
	}

	function handleSubmitEvent(event: Event, callback: FormOptions['onSubmit']) {
		event.preventDefault()
		form.validateForm()

		if (callback) {
			callback(event, form)
		}
	}

	node.addEventListener("reset", function (event) {
		handleResetEvent(event, form.options.onReset)
	})

	node.addEventListener("submit", function (event) {
		handleSubmitEvent(event, form.options.onSubmit)
	})

	// Attach formify to inputs
	inputs.forEach((input) => {
		if (form.fields.hasOwnProperty(input.name)) {
			input.addEventListener("blur", function (event) {
				form.handleBlurEvent(event, form.fields[input.name])
			})

			input.addEventListener("change", function (event) {
				form.handleChangeEvent(event, form.fields[input.name])
			})

			input.addEventListener("focus", function (event) {
				form.handleFocusEvent(event, form.fields[input.name])
			})

			input.addEventListener("input", function (event) {
				form.handleInputEvent(event, form.fields[input.name])
			})
		}
	})

	return {
		destroy() {
			node.removeEventListener("reset", function (event) {
				handleResetEvent(event, form.options.onReset)
			})

			node.removeEventListener("submit", function (event) {
				handleSubmitEvent(event, form.options.onSubmit)
			})

			inputs.forEach((input) => {
				if (form.fields.hasOwnProperty(input.name)) {
					input.removeEventListener("blur", function (event) {
						form.handleBlurEvent(event, form.fields[input.name])
					})

					input.removeEventListener("change", function (event) {
						form.handleChangeEvent(event, form.fields[input.name])
					})

					input.removeEventListener("focus", function (event) {
						form.handleFocusEvent(event, form.fields[input.name])
					})

					input.removeEventListener("input", function (event) {
						form.handleInputEvent(event, form.fields[input.name])
					})
				}
			})
		}
	}
}