<script lang="ts">
	import { formify, createForm } from "$lib/formifier/formifier.svelte.js"
	import { z } from "zod";

	let form = createForm({
		fields: {
			username: {
				default: "Username",
				listeners: {
					onBlur: (input) => console.log("Input Blurred", input.value),
					onChange: (input) => console.log("Input Changed", input.value),
					onInput: (input) => console.log("On Input", input.value)
				},
				validation: {
					schema: z.string().max(2),
					trigger: 'oninput'
				}
			},
			password: {}
		},
		onSubmit: () => console.log("Form Submitted")
	})

	$inspect(form.fields)

</script>

<h1>Hello Svelte Formifier</h1>

<form use:formify={form}>
	<label for="username">Username</label>
	<input type="text" name="username" bind:value={form.fields.username.value}>
	<p style="color: #f00">{form.fields.username.error}</p>

	<label for="password">Password</label>
	<input type="text" name="password" bind:value={form.fields.password.value}>

	<button>Submit</button>
</form>