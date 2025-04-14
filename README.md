# Svelte Formifier

Svelte Formifier provides headless and type-safe form state management for Svelte 5. It is intended to be an ultimate solution for handling forms in Svelte 5 based single-page applications (SPAs).

## Motivation

Currently there is no solution for Svelte 5 apps to handle forms straight forward on the client-side. This project is our take to provide such a solution.

With Svelte Formifier, developers can tackle the following form-related challenges:
- Reactive data binding 
- Complex validation and error handling
- Conditional visibility

## General Example

Here's simple general example to see Svelte Formifier in action:

```ts
<script lang="ts">
	import { formify, createForm } from '$lib/formifier/formifier.svelte.js';

    // Create the form object that holds the reactive state and provides 
    // an API to interact with the form state
	let form = createForm({
		fields: {
			username: {
				default: 'Username',
                validator: (field) => field.value.length > 3 ? null : { message: 'Error' }},
			password: {}
		},
		onSubmit: (event, form) => console.log('Form Submitted')
	});
</script>

<form use:formify={form}>
	<label for="username">Username</label>
	<input type="text" name="username" bind:value={form.fields.username.value} />
	<p style="color: #f00">{form.fields.username.error}</p>

	<label for="password">Password</label>
	<input type="text" name="password" bind:value={form.fields.password.value} />

	<button disabled={form.hasErrors}>Submit</button>
	<button type="reset">Reset</button>
</form>
```

## Key Concepts

### Form Options

``Form options`` are used to setup a `Form Instance`. The form options allow to configure individual form fields as well as the entire form.

### Form Instance

The form instance **holds the state** of the form and **provides an API** to interact with the form state. Conceptually, the form instance is comprised of one or multiple form fields, where the form fields correspond with the inputs of an HTML form.

### Form Fields

Form fields represent the individual inputs of an HTML form. 

#### Field State

Each form field has the following reactive state elements:

- `value`: The current value of the form field
- `isChanged`: Is set to `true` when the field's value uis different than the default value
- `isDirty`: Is set to `true` when the user inputs anything into the field
- `isTouched`: Is set to `true` when the user tabs/clicks into the field

Typically, the `value` is bound to an HTML `<input>`'s value attribute:

```html
<input name="fieldname" bind:value={ form.fields.fieldname.value }/>
```

Likewise the other state variables can be used to bind with other attributes. 

### Validation

Validation can be ``schema based`` or ``function based``. The schema based approach uses validation schemas from libraries like [Zod](https://zod.dev/) to validate each field. The function based approach uses a callback function that gets the form field's state as an argument and returns either **null**, if the validation passes, or an **array with the error objects**, if the validation fails.

Validation can take place based on certain HTML input events called ``Validation Triggers``. I.e. validation can be triggered for the 

- `onBlur`, 
- `onChange`, 
- `onFocus`,
- `onInput`,
- `onMount`,
- `onSubmit`

input events.

#### Validation Strategies

Different validation strategies allow to customize whether to validate **individual fields**, a **subset of fields**, the **entire form** or a **combination of all thereof**.

#### Validation Triggers

Validation triggers allow to **customize the timing** of the validation.

#### Schema Based Validation

The most basic way to define schema based validation is by setting the `field.validator` property to a validation schema. This triggers the validation right before submitting the form.

```diff
let form = createForm({
    fields: {
        fieldname: {
+           validator: z.string().min(3).max(32),
        },
    },
});
```

Add a little more customization by specifying a `validation` object and setting the `validation.validator` property to a validation schema and the `validation.triggers` property, which defines when the validation should run other than right before the submission of the form.

```diff
let form = createForm({
    fields: {
        fieldname: {
+           validation: {
+               validator: z.string().min(3).max(32),
+               triggers: ['onchange','onmount']
+           }
        },
    },
});
```

For advanced use cases, e.g. when different validation schemas shall be used for different triggers, the schemas can be assigned to the respective trigger properties for full customization of the validation flow.

```diff
let form = createForm({
    fields: {
        fieldname: {
+           validation: {
+               onblur: z.string().min(1),
+               onchange: z.string().min(2),
+               onfocus: z.string().min(3),
+               oninput: z.string().min(4),
+               onmount: z.string().min(5),
+           }
        },
    },
});
```

#### Function Based Validation

#### Validation Errors

#### Field Validation

#### Form Validation

#### Async Validation

`TBD`

### Form Listeners

### Submission Handling

### Reset Handling

### Conditional Visibility