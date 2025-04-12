import type { ZodString } from "zod"

interface ValidationOptionBase {
	trigger?: 'onblur' | 'onchange' | 'oninput' | 'onsubmit'
}

interface ValidationWithSchema extends ValidationOptionBase {
	schema: ZodString
	validator: never
}

interface ValidationWithValidator extends ValidationOptionBase {
	schema: never
	validator: (field: FormField) => string
}

type ValidationFormOption = ValidationWithSchema | ValidationWithValidator

interface FieldFormOption {
	default?: string
	listeners?: {
		onBlur: (field: FormField) => void
		onChange: (field: FormField) => void
		onInput: (field: FormField) => void
	}
	validation?: ValidationFormOption
}

interface FieldsFormOption {
	[propName: string]: FieldFormOption
}

export interface FormOptions {
	fields: FieldsFormOption
	onReset?: (event: EventTarget | null) => void
	onSubmit?: (event: EventTarget | null) => void
}

interface FormFields {
	[propName: string]: FormField
}

interface FormField {
	name: string
	error: string | null
	value: string | null
}

class Form {
	readonly options: FormOptions
	readonly fields = $state<FormFields>({})
	readonly errors = $derived.by<string[]>(() => {
		let errors: string[] = []
		Object.keys(this.fields).forEach((key) => {
			if (this.fields[key].error) {
				errors.push(this.fields[key].error)
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
		let fields = {}

		Object.keys(options.fields).forEach((key: keyof typeof options.fields) => {
			fields[key] = this.createFormField(key as string, options.fields[key])
		})

		return fields
	}

	createFormField(name: string, option: FieldFormOption): FormField {
		return {
			error: null,
			name: name,
			value: option.default ?? null
		}
	}

	handleBlurEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		if (options.validation?.trigger == 'onblur') {
			this.validate(field)
		}

		options.listeners?.onBlur?.(field)
	}

	handleChangeEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		if (!options.validation?.trigger || options.validation?.trigger == 'onchange') {
			this.validate(field)
		}

		options.listeners?.onChange?.(field)
	}

	handleInputEvent(event: Event, field: FormField) {
		const options = this.options.fields[field.name]

		if (options.validation?.trigger == 'oninput') {
			this.validate(field)
		}

		options.listeners?.onChange?.(field)
	}

	reset(): void {
		Object.keys(this.fields).forEach((key) => {
			if (this.options.fields[key]) {
				this.fields[key] = this.createFormField(key as string, this.options.fields[key])
			}
		})
	}

	validate(field: FormField): string | null {
		if (this.options.fields[field.name]?.validation) {
			const schema = this.options.fields[field.name]?.validation?.schema
			if (schema) {
				const result = schema.safeParse(field.value)
				field.error = result.success ? null : "Schema validation error"
				return field.error
			}
			else {
				field.error = "Validator validation error"
				return "Validator validation error"
			}
		}

		return null
	}
}

export function createForm(options: FormOptions): Form {
	return new Form(options)
}

export function formify(node: HTMLFormElement, form: Form) {
	const inputs = node.querySelectorAll('input')

	function handleResetEvent(event: Event, callback: FormOptions['onReset']) {
		if (callback) {
			callback(event.target)
		}
		else {
			event.preventDefault()
			form.reset()
		}
	}

	function handleSubmitEvent(event: Event, callback: FormOptions['onSubmit']) {
		event.preventDefault()
		if (callback) {
			callback(event.target)
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

					input.removeEventListener("input", function (event) {
						form.handleInputEvent(event, form.fields[input.name])
					})
				}
			})
		}
	}
}