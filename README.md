# Svelte Formifier

> [!WARNING]
> This repo is currently heavily under development and **not even** in `alpha` state. I highly discourage using this code for any serious project right now. Also, not all feature listed in this `README` are implemented, yet.

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

> [!NOTE]
> All validations are run just before submitting the form by default, so we can be sure that all validation errors are set correctly when the `form.onSubmit` callback is run.

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

> [!NOTE]
> Since all validations are run just before submitting the form by default, you don't have to set the `onsubmit` trigger explicitely.

For advanced use cases, e.g. when different validation schemas shall be used for different triggers, the validation schemas can be assigned to the respective trigger properties for full customization of the validation flow.

```diff
+ const onBlurSchema = z.string() ...
+ const onChangeSchema = z.string() ...
// ...

let form = createForm({
    fields: {
        fieldname: {
+           validation: {
+               onBlur: onBlurSchema,
+               onChange: onChangeSchema,
+               onFocus: onFocusSchema,
+               onInput: onInputSchema,
+               onMount: onMountSchema,
+               onSubmit: onSubmitSchema,
+           }
        },
    },
});
```

#### Function Based Validation

A validation function must return `null` if the validation passes, or an array of validation error objects (of type `ValidationError`), if validation fails.

```js
function validateField(field): ValidationError[] | null {
	return validationPassed ? null : [{ name: field.name, message: "Validation failed"}]
}
```

Function based validation works quite similar than schema based validation. Just replace the schema with a validation function that will be run according to the specified validation triggers.

Define the validation by setting the `field.validator` property to a validation function. This triggers the validation right before submitting the form.

```diff
let form = createForm({
    fields: {
        fieldname: {
+           validator: (field) => field.value.length < 3 || field.value.length > 32 ? null : 'Value must have min. 3 and max. 32 characters',
        },
    },
});
```

> [!NOTE]
> All validations are run just before submitting the form by default, so we can be sure that all validation errors are set correctly when the `form.onSubmit` callback is run.

Add a little more customization by specifying a `validation` object and setting the `validation.validator` property to a validation function and the `validation.triggers` property, which defines when the validation should run other than right before the submission of the form.

```diff
let form = createForm({
    fields: {
        fieldname: {
+           validation: {
+               validator: (field) => field.value.length < 3 || field.value.length > 32 ? null : 'Value must have min. 3 and max. 32 characters',
+               triggers: ['onchange','onmount']
+           }
        },
    },
});
```
> [!NOTE]
> Since all validations are run just before submitting the form by default, you don't have to set the `onsubmit` trigger explicitely.

For advanced use cases, e.g. when different validation schemas shall be used for different triggers, the validation functions can be assigned to the respective trigger properties for full customization of the validation flow.

```diff
+ function validateOnBlur(field) { ... }
+ function validateOnChange(field) { ... }
// ...

let form = createForm({
    fields: {
        fieldname: {
+           validation: {
+               onBlur: (field) => validateOnBlur(field),
+               onChange: (field) => validateOnChange(field),
+               onFocus: (field) => validateOnFocus(field),
+               onInput: (field) => validateOnInput(field),
+               onMount: (field) => validateOnMount(field),
+               onSubmit: (field) => validateOnSubmit(field),
+           }
        },
    },
});
```

#### Validation Errors

Validation errors are represented by `ValidationError` objects. A validation error object has a mandatory `name` and `message` property.

```ts
interface ValidationError {
	name: string
	message: string
}
```

#### Field Validation

Each form field has an `errors` property which holds the current validation errors, if any. If there are no validation errors, the property is `null`.

To render all errors for a given field, use a snippet like this:

```js svelte
{#each form.fields.fieldname.errors as error}
	<div>{error.message}</div>
{/each}
```

For convenience, there's also an `error` property, that holds a string with the concatenated error messages, if validation failed, otherwise the `error` property is `null`.

```js svelte
<span>{form.fields.fieldname.error}</span>
```

#### Form Validation

There is an `errors` property which holds the current validation errors for the **entire form**, if any. If there are no validation errors, the property is `null`.

To render the errors for the entire form, just use a snippet like this:

```js svelte
{#each form.errors as error}
	<div>{error.name + ': ' + error.message}</div>
{/each}
```

#### Async Validation

`TBD`

### Form Listeners

`TBD`

### Submission Handling

`TBD`

### Reset Handling

`TBD`

### Multiple Forms Support

`TBD`

## Additional Features

### Saving Form State

`TBD`

### Conditional Visibility

Svelte-formifier by default shows all fields of a form. However, sometimes it's required to show/hide certain fields dynamically based on the value of another field or a group of fields. You can either use plain Svelte 5 means to accomplish this or use `svelte-formifier`'s reactive `visible` property of a field. 

The following example shows how to show/hide additional fields based on the value of another field with plain Svelte 5 template means. If the value of the `hobby` fields is not falsy, the input for the `club` field is shown, otherwise it's hidden.

```svelte
<script lang="ts">
	import { formify, createForm } from '$lib/formifier/formifier.svelte.js';
    let form = createForm({
        fields: {
            club: {}
            hobby: {}
        }
    })
</script>

<form use:formify={form}>
    <input type="text" name="hobby" bind:value={form.fields.hobby.value} />

    {#if form.fields.hobby.value}
        <input type="text" name="hobbyClub" bind:value={form.fields.hobbyClub.value} />
        <input type="text" name="hobbyCity" bind:value={form.fields.hobbyCity.value} />
    {/if}
</form>
```

For more complex logic, `svelte-formifier` provides 

```svelte
<script lang="ts">
	import { formify, createForm } from '$lib/formifier/formifier.svelte.js';
    let form = createForm({
        fields: {
            hobby: {},
            hobbyCity: {},
            hobbyClub: {}
        }
    })
</script>

<form use:formify={form}>
    <input type="text" name="hobby" bind:value={form.fields.hobby.value} />

        <input type="text" name="hobbyCity" 
            bind:value={form.fields.hobbyCity.value} 
            hidden={!form.fields.hobbyCity.isVisible} />
        <input type="text" name="hobbyClub" 
            bind:value={form.fields.hobbyClub.value} 
            hidden={form.fields.hobbyCity.isHidden} />
</form>
```