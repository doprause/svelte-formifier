import type { ZodSchema, ZodTypeAny } from 'zod'

type ListenerFunction = (field: FormField) => void

interface ValidationError {
    name: string
    message: string
}
type ValidationResult = ValidationError[] | null
type ValidationTriggers = 'auto' | 'onblur' | 'onchange' | 'onfocus' | 'oninput' | 'onmount'
type ValidatorFunction = (field: FormField) => ValidationResult
type ValidatorFormOption = ValidatorFunction | ZodTypeAny
type ValidationFormOption = {
    triggers?: ValidationTriggers[]
    validator?: ValidatorFormOption
    onBlur?: ValidatorFormOption
    onChange?: ValidatorFormOption
    onFocus?: ValidatorFormOption
    onInput?: ValidatorFormOption
    onMount?: ValidatorFormOption
    onSubmit?: ValidatorFormOption
}
type VisibilityFunction = (form: Form) => boolean

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
    visible?: VisibilityFunction
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
    isHidden: boolean
    isTouched: boolean
    isVisible: boolean
    name: string
    error: string | null
    errors: ValidationError[] | null
    value: string | null
}

class Form {
    readonly options: FormOptions
    readonly fields = $state<FormFields>({})
    readonly errors: ValidationError[] = $derived.by<ValidationError[]>(() => {
        let errors: ValidationError[] = []
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

    // TODO: We might have to implement a full fletched FormField class for this to work

    constructor(options: FormOptions) {
        this.options = options
        this.fields = this.createFormFields(options)
        this.updateVisibility()
    }

    createFormFields(options: FormOptions): FormFields {
        let fields: FormFields = {}

        Object.keys(options.fields).forEach((key: keyof typeof options.fields) => {
            fields[key] = this.createFormField(key as string, options.fields[key])

            if (options.fields[key].validation?.onMount) {
                this.validate(fields[key], options.fields[key].validation?.onMount)
            } else if (options.fields[key].validation?.triggers?.includes('onmount')) {
                this.validate(fields[key])
            }
        })

        return fields
    }

    createFormField(name: string, option: FieldFormOption): FormField {
        return {
            isChanged: false,
            isDirty: false,
            isHidden: false,
            isTouched: false,
            isVisible: true,
            error: null,
            errors: null,
            name: name,
            value: option.default ?? null
        }
    }

    updateVisibility() {
        Object.keys(this.fields).forEach((key: keyof typeof this.fields) => {
            if (this.options.fields[key].visible) {
                this.fields[key].isVisible = this.options.fields[key].visible(this)
                this.fields[key].isHidden = !this.fields[key].isVisible
            }
        })
    }

    handleBlurEvent(event: Event, field: FormField) {
        const options = this.options.fields[field.name]
        const validator = this.options.fields[field.name].validation?.onBlur

        if (validator) {
            this.validate(field, validator)
        } else if (options.validation?.triggers?.includes('onblur')) {
            this.validate(field)
        }

        options.listeners?.onBlur?.(field)
    }

    handleChangeEvent(event: Event, field: FormField) {
        const options = this.options.fields[field.name]
        const validator = this.options.fields[field.name].validation?.onChange

        if (validator) {
            this.validate(field, validator)
        } else if (options.validation?.triggers?.includes('onchange')) {
            this.validate(field)
        } else if (!options.validation?.triggers) {
            // Validate on field changed if there are not more specific triggers
            this.validate(field)
        }

        this.updateVisibility()

        options.listeners?.onChange?.(field)
    }

    handleFocusEvent(event: Event, field: FormField) {
        const options = this.options.fields[field.name]
        const validator = this.options.fields[field.name].validation?.onFocus

        field.isTouched = true

        if (validator) {
            this.validate(field, validator)
        } else if (options.validation?.triggers?.includes('onfocus')) {
            this.validate(field)
        }

        options.listeners?.onFocus?.(field)
    }

    handleInputEvent(event: Event, field: FormField) {
        const options = this.options.fields[field.name]
        const validator = this.options.fields[field.name].validation?.onInput

        field.isDirty = true
        field.isChanged = field.value !== options.default

        if (validator) {
            this.validate(field, validator)
        } else if (options.validation?.triggers?.includes('oninput')) {
            this.validate(field)
        } else if (field.error && !options.validation?.triggers) {
            // We want to validate on field input if there are errors and
            // if there are not more specific triggers
            this.validate(field)
        }

        this.updateVisibility()

        options.listeners?.onInput?.(field)
    }

    reset(): void {
        Object.keys(this.fields).forEach((key) => {
            if (this.options.fields[key]) {
                this.fields[key] = this.createFormField(key as string, this.options.fields[key])
            }
        })

        this.updateVisibility()
    }

    validate(field: FormField, validator?: ValidatorFormOption): ValidationResult {
        let result: ValidationResult = null
        let theValidator = null

        // Get validator
        if (validator) {
            theValidator = validator
        } else if (this.options.fields[field.name]?.validation) {
            theValidator = this.options.fields[field.name]?.validation?.validator
        } else if (this.options.fields[field.name]?.validator) {
            theValidator = this.options.fields[field.name]?.validator
        }

        // Validate
        if (theValidator && typeof theValidator === 'function') {
            result = theValidator(field)
        } else if (theValidator) {
            const schema = theValidator as ZodSchema
            const parseResult = schema.safeParse(field.value)
            result = parseResult.success
                ? null
                : parseResult.error.errors.map((error) => {
                      return {
                          name: field.name,
                          message: error.message
                      }
                  })
        }

        // Set errors
        field.error = result ? result.map((error) => error.message).join('|') : null
        field.errors = result

        console.log(`Validating field: ${field.name} > ${field.error}`)

        return result
    }

    validateForm() {
        console.log('Validating form')

        Object.keys(this.fields).forEach((key) => {
            if (this.options.fields[key]) {
                const validator = this.options.fields[key].validation?.onSubmit
                if (validator) {
                    this.validate(this.fields[key], validator)
                } else {
                    this.validate(this.fields[key])
                }
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
        } else {
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

    node.addEventListener('reset', function (event) {
        handleResetEvent(event, form.options.onReset)
    })

    node.addEventListener('submit', function (event) {
        handleSubmitEvent(event, form.options.onSubmit)
    })

    // Attach formify to inputs
    inputs.forEach((input) => {
        if (form.fields.hasOwnProperty(input.name)) {
            input.addEventListener('blur', function (event) {
                form.handleBlurEvent(event, form.fields[input.name])
            })
            input.addEventListener('change', function (event) {
                form.handleChangeEvent(event, form.fields[input.name])
            })
            input.addEventListener('focus', function (event) {
                form.handleFocusEvent(event, form.fields[input.name])
            })
            input.addEventListener('input', function (event) {
                form.handleInputEvent(event, form.fields[input.name])
            })
        } else if (form.fields.hasOwnProperty(input.id)) {
            input.addEventListener('blur', function (event) {
                form.handleBlurEvent(event, form.fields[input.id])
            })
            input.addEventListener('change', function (event) {
                form.handleChangeEvent(event, form.fields[input.id])
            })
            input.addEventListener('focus', function (event) {
                form.handleFocusEvent(event, form.fields[input.id])
            })
            input.addEventListener('input', function (event) {
                form.handleInputEvent(event, form.fields[input.id])
            })
        }
    })

    return {
        destroy() {
            node.removeEventListener('reset', function (event) {
                handleResetEvent(event, form.options.onReset)
            })

            node.removeEventListener('submit', function (event) {
                handleSubmitEvent(event, form.options.onSubmit)
            })

            inputs.forEach((input) => {
                if (form.fields.hasOwnProperty(input.name)) {
                    input.removeEventListener('blur', function (event) {
                        form.handleBlurEvent(event, form.fields[input.name])
                    })
                    input.removeEventListener('change', function (event) {
                        form.handleChangeEvent(event, form.fields[input.name])
                    })
                    input.removeEventListener('focus', function (event) {
                        form.handleFocusEvent(event, form.fields[input.name])
                    })
                    input.removeEventListener('input', function (event) {
                        form.handleInputEvent(event, form.fields[input.name])
                    })
                } else if (form.fields.hasOwnProperty(input.id)) {
                    input.removeEventListener('blur', function (event) {
                        form.handleBlurEvent(event, form.fields[input.id])
                    })
                    input.removeEventListener('change', function (event) {
                        form.handleChangeEvent(event, form.fields[input.id])
                    })
                    input.removeEventListener('focus', function (event) {
                        form.handleFocusEvent(event, form.fields[input.id])
                    })
                    input.removeEventListener('input', function (event) {
                        form.handleInputEvent(event, form.fields[input.id])
                    })
                }
            })
        }
    }
}
