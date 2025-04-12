<script lang="ts">
	import { formify, createForm } from '$lib/formifier/formifier.svelte.js';
	import { z } from 'zod';

	let form = createForm({
		fields: {
			username: {
				default: 'Username',
				listeners: {
					onBlur: (input) => console.log('Input Blurred', input.value),
					onChange: (input) => console.log('Input Changed', input.value),
					onInput: (input) => console.log('On Input', input.value)
				},
				validation: {
					schema: z.string().max(2),
					trigger: 'oninput'
				}
			},
			password: {}
		},
		onReset: () => console.log('Form Reset'),
		onSubmit: () => console.log('Form Submitted')
	});
</script>

<h1>Hello Svelte Formifier</h1>

<form use:formify={form}>
	<label for="username">Username</label>
	<input type="text" name="username" bind:value={form.fields.username.value} />
	<p style="color: #f00">{form.fields.username.error}</p>

	<label for="password">Password</label>
	<input type="text" name="password" bind:value={form.fields.password.value} />

	<button disabled={form.hasErrors}>Submit</button>
	<button type="reset">Reset</button>
	<button type="button" onclick={() => form.reset()}>Test</button>

	{#each form.errors as error}
		<span style="color: red">{error}</span>
	{/each}
</form>
