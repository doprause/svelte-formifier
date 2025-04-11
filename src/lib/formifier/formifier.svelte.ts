import type { ZodString } from "zod"

interface ValidationOptionBase {
	trigger?: 'onblur' | 'onchange' | 'onsubmit'
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
	}
	validation?: ValidationFormOption
}

interface FieldsFormOption {
	[propName: string]: FieldFormOption
}

export interface FormOptions {
	fields: FieldsFormOption
	onSubmit: (event: EventTarget | null) => void
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
		console.log("FieldFormOption", option)
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

	validate(field: FormField): string | null {
		if(this.options.fields[field.name]?.validation) {
			const schema = this.options.fields[field.name]?.validation?.schema
			if(schema) {
				console.log("Validate with Schema")
				const result = schema.safeParse(field.value)
				field.error = result.success ? null : "Schema validation error"
				return field.error
			}
			else {
				console.log("Validate with Validator")
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

	// Get fields & buttons
	const inputs = node.querySelectorAll('input')

	// console.log(inputs)

	function handleSubmitEvent(event: Event, callback: FormOptions['onSubmit']) {
		event.preventDefault()
		callback(event.target)
	}

	node.addEventListener("submit", function(event) {
		handleSubmitEvent(event, form.options.onSubmit)
	})

	// Attach formify to inputs
	inputs.forEach((input) => {
		if (form.fields.hasOwnProperty(input.name)) {
			input.addEventListener("blur", function(event) {
				form.handleBlurEvent(event, form.fields[input.name])
			})

			input.addEventListener("change", function(event) {
				form.handleChangeEvent(event, form.fields[input.name])
			})
		}
	})
	
	return {
		destroy() {
			inputs.forEach((input) => {
				if (form.fields.hasOwnProperty(input.name)) {
					input.removeEventListener("blur", function(event) {
						form.handleBlurEvent(event, form.fields[input.name])
					})
		
					input.removeEventListener("change", function(event) {
						form.handleChangeEvent(event, form.fields[input.name])
					})
				}
			})
		}
	}
}