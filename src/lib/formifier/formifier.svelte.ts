class Form {
	constructor(options) {
		this.options = options
	}
}

export function createForm(options) {
	return new Form(options)
}

export function formify(node, form) {

	// Get fields & buttons
	const fields = node.querySelectorAll('input')
	const buttons = node.querySelectorAll('button')

	// console.log(fields)
	// console.log(buttons)

	function handleSubmit(event, callback) {
		event.preventDefault()
		callback(event.target)
	}

	node.addEventListener("submit", function(event) {
		handleSubmit(event, form.options.onSubmit)
	})

	// Attach formify to fields
	fields.forEach((field) => {
		if (form.options.fields.hasOwnProperty(field.name)) {
			field.value = form.options.fields[field.name].default

			field.addEventListener("blur", function(event) {
				form.options.fields[field.name].listeners.onBlur?.(event.target)
			})

			field.addEventListener("change", function(event) {
				form.options.fields[field.name].listeners.onChange?.(event.target)
			})

			field.addEventListener("mount", function(event) {
				form.options.fields[field.name].listeners.onMount?.(event.target)
			})

			field.addEventListener("submit", function(event) {
				form.options.fields[field.name].listeners.onSubmit?.(event.target)
			})
		}
	})
	
	return {
		destroy() {
			fields.forEach((field) => {
				if (form.options.fields.hasOwnProperty(field.name)) {		
					field.removeEventListener("blur", function(event) {
						form.options.fields[field.name].listeners.onblur?.(event.target)
					})
		
					field.removeEventListener("change", function(event) {
						form.options.fields[field.name].listeners.onchange?.(event.target)
					})
		
					field.removeEventListener("mount", function(event) {
						form.options.fields[field.name].listeners.onmount?.(event.target)
					})
		
					field.removeEventListener("submit", function(event) {
						form.options.fields[field.name].listeners.onsubmit?.(event.target)
					})
				}
			})
		}
	}
}