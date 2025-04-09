<script lang="ts">
	import { formify, createForm } from "$lib/formifier/formifier.svelte.js"

	let form = createForm({
		fields: {
			username: {
				default: "Username 123",
				listeners: {
					onBlur: (input) => console.log("Input Blurred", input.value),
					onChange: (input) => console.log("Input Changed", input.value),
					onMount: (input) => console.log("Input Mounted", input.value),
					onSubmit: (input) => console.log("Input Submitted", input.value)
				},
				validators: {}
			}
		},
		onSubmit: () => console.log("Form Submitted")
	})
</script>

<h1>Hello Svelte Formifier</h1>

<form use:formify={form}>
	<label for="username">Username</label>
	<input type="text" name="username">
	<button>Submit</button>
</form>