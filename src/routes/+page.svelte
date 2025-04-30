<script lang="ts">
    import { formify, createForm } from '$lib/formifier/formifier.svelte.js'
    import { fade } from 'svelte/transition'
    import { z } from 'zod'

    let form = createForm({
        fields: {
            username: {
                default: 'Username',
                listeners: {
                    onBlur: (input) => console.log('Input Blurred', input.value),
                    onChange: (input) => console.log('Input Changed', input.value),
                    onInput: (input) => console.log('On Input', input.value)
                },
                validator: z.string().max(12)
            },
            email: {
                default: 'user@example.com',
                validation: {
                    validator: z.string().max(12),
                    triggers: ['onchange']
                }
            },
            street: {
                default: 'Main Street',
                validation: {
                    validator: (field) => {
                        return !field.value || field.value.length < 12
                            ? null
                            : [{ name: field.name, message: 'String must be < 12 chars' }]
                    },
                    triggers: ['onchange', 'oninput']
                }
            },
            hobby: {
                validation: {
                    onBlur: (field) => {
                        return [{ name: field.name, message: 'onblur' }]
                    },
                    onChange: (field) => {
                        return [{ name: field.name, message: 'onchange' }]
                    },
                    onFocus: (field) => {
                        return [{ name: field.name, message: 'onfocus' }]
                    },
                    onInput: (field) => {
                        return [{ name: field.name, message: 'oninput' }]
                    },
                    onMount: (field) => {
                        return [{ name: field.name, message: 'onmount' }]
                    },
                    onSubmit: (field) => {
                        return [{ name: field.name, message: 'onsubmit' }]
                    }
                }
            },
            hobbyClub: {},
            hobbyCity: {
                visible: (form) =>
                    form.fields.hobby.value && form.fields.hobby.value.length > 3 ? true : false
            },
            password: {}
        },
        onReset: (event, form) => console.log('Form Reset', event, form),
        onSubmit: (event, form) => console.log('Form Submitted', event, form)
    })

    $inspect(form.fields)
</script>

<h1>Svelte Formifier Example</h1>

<!-- Attach Svelte Formify to the form element with use:formify={form} -->
<form use:formify={form}>
    <div>
        <label for="username">Username</label>
        <input type="text" name="username" bind:value={form.fields.username.value} />
        {#if form.fields.username.isTouched}
            ✋(T)
        {/if}
        {#if form.fields.username.isDirty}
            💩(D)
        {/if}
        {#if form.fields.username.isChanged}
            ✨(C)
        {/if}
        <p style="color: #f00">{form.fields.username.error}</p>
    </div>

    <div>
        <label for="email">Email</label>
        <input type="text" name="email" bind:value={form.fields.email.value} />
        <p style="color: #f00">{form.fields.email.error}</p>
    </div>

    <div>
        <label for="street">Street</label>
        <input type="text" name="street" bind:value={form.fields.street.value} />
        <p style="color: #f00">{form.fields.street.error}</p>
    </div>

    <div>
        <label for="hobby">Hobby</label>
        <input type="text" name="hobby" bind:value={form.fields.hobby.value} />
        <p style="color: #f00">{form.fields.hobby.error}</p>
    </div>

    {#if form.fields.hobby.value}
        <div transition:fade>
            <label for="club">Hobby Club</label>
            <input type="text" name="hobbyCity" bind:value={form.fields.hobbyCity.value} />
        </div>
    {/if}
    <div>
        <label for="club">Hobby City</label>
        <input
            type="text"
            name="hobbyClub"
            bind:value={form.fields.hobbyCity.value}
            hidden={form.fields.hobbyCity.isHidden}
        />
    </div>

    <div>
        <label for="password">Password</label>
        <input type="text" name="password" bind:value={form.fields.password.value} />
        <p style="color: #f00">{form.fields.password.error}</p>
    </div>

    <div>
        <!-- <button disabled={form.hasErrors}>Submit</button> -->
        <button>Submit</button>
        <button type="reset">Reset</button>
        <button type="button" onclick={() => form.reset()}>Test</button>
    </div>

    <!-- List all errors -->
    {#each form.errors as error}
        <div style="color: red">{error.name + ': ' + error.message}</div>
    {/each}
    {#each form.errors.map((error) => error.name + ': ' + error.message).join(' | ') as error}
        <span style="color: red">{error}</span>
    {/each}
</form>
