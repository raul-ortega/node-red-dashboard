<template>
    <label v-if="label" class="nrdb-ui-form-label">{{ label }}</label>
    <v-form ref="form" validate-on="input" :style="{'margin-top': label ? 0 : '0.5rem'}" @submit.prevent="onSubmit">
        <div class="nrdb-ui-form-rows" :class="{'nrdb-ui-form-rows--split': props.splitLayout}">
            <div v-for="row in options" :key="row.key" class="nrdb-ui-form-row" :data-form="`form-row-${row.key}`">
                <v-checkbox
                    v-if="row.type === 'checkbox'"
                    v-model="input[row.key]"
                    :label="formattedLabel(row)"
                    hide-details="auto"
                />
                <v-select
                    v-else-if="row.type === 'dropdown'"
                    v-model="input[row.key]"
                    class="nrdb-ui-widget"
                    :label="formattedLabel(row)"
                    :class="{'active': state}"
                    hide-details="auto" :rules="rules(row)"
                    color="primary" variant="outlined"
                    :items="filteredDropdownOptions(row.key)"
                    item-title="label"
                    item-value="value"
                />
                <v-switch
                    v-else-if="row.type === 'switch'"
                    v-model="input[row.key]"
                    class="nrdb-ui-widget"
                    :label="formattedLabel(row)"
                    :class="{'active': state}"
                    hide-details="auto"
                    color="primary"
                />
                <v-textarea
                    v-else-if="row.type === 'multiline'"
                    v-model="input[row.key]" :rules="rules(row)"
                    class="nrdb-ui-widget nrdb-ui-text-field" :rows="row.rows"
                    :label="formattedLabel(row)" variant="outlined" hide-details="auto"
                />
                <v-text-field
                    v-else
                    v-model="input[row.key]" :rules="rules(row)"
                    class="nrdb-ui-widget nrdb-ui-text-field"
                    :label="formattedLabel(row)" :type="row.type" variant="outlined" hide-details="auto"
                />
            </div>
        </div>
        <div class="nrdb-ui-form-actions">
            <v-btn data-action="form-submit" type="submit" variant="flat" size="large" :disabled="submitEnabled">{{ props.submit || 'submit' }}</v-btn>
            <v-btn data-action="form-clear" variant="outlined" size="large" @click="clear">Clear</v-btn>
        </div>
    </v-form>
</template>

<script>
import { mapState } from 'vuex' // eslint-disable-line import/order

export default {
    name: 'DBUIAvidabricksInput',
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    data () {
        return {
            label: 'Data Entry',
            options: [
                {
                    key: 'sequence',
                    type: 'text',
                    label: 'Sequence',
                    required: true
                },
                {
                    key: 'input1',
                    type: 'number',
                    label: 'Input 1'
                },
                {
                    key: 'input2',
                    type: 'number',
                    label: 'Input 2'
                },
                {
                    key: 'input3',
                    type: 'number',
                    label: 'Input 3'
                },
                {
                    key: 'plot',
                    type: 'dropdown',
                    label: 'Plot',
                    required: true
                }
            ],
            dropdownOptions: [
                { dropdown: 'plot', label: 'Genome', value: 'genome' },
                { dropdown: 'plot', label: 'Epigenome', value: 'epigenome' }
            ],
            input: {},
            isValid: true
        }
    },
    computed: {
        ...mapState('data', ['messages']),
        submitEnabled: function () {
            return !(this.isValid)
        }
    },
    created () {
        // can't do this in setup as we are using custom onInput function that needs access to 'this'
        this.$dataTracker(this.id, this.onInput, null, this.onDynamicProperties)
    },
    mounted () {
        this.reset()
    },
    methods: {
        onSubmit: function () {
            const options = this.options
            // Clear unused keys from `input`, to prevent sending old keys on next submit
            const allowed = options.map(opt => opt.key)
            this.input = Object.keys(this.input)
                .filter(key => allowed.includes(key))
                .reduce((obj, key) => {
                    return {
                        ...obj,
                        [key]: this.input[key]
                    }
                }, {})
            // Prevent sending null for switch and checkbox, if type number send as Number or null if nothing present on text field and if other fields not present, send empty string
            options.forEach(opt => {
                if (opt.type === 'checkbox' || opt.type === 'switch') {
                    if (typeof (this.input[opt.key]) === 'undefined' || this.input[opt.key] === null) {
                        this.input[opt.key] = false
                    }
                } else if (opt.type === 'number') {
                    if (typeof (this.input[opt.key]) === 'undefined' || this.input[opt.key] === null) {
                        this.input[opt.key] = null
                    } else {
                        if (isNaN(this.input[opt.key])) {
                            this.input[opt.key] = null
                        } else {
                            this.input[opt.key] = Number(this.input[opt.key])
                        }
                    }
                } else {
                    if (typeof (this.input[opt.key]) === 'undefined' || this.input[opt.key] === null) {
                        this.input[opt.key] = ''
                    }
                }
            })

            this.$socket.emit('widget-action', this.id, {
                payload: this.input,
                _event: 'submit'
            })
            if (this.props.resetOnSubmit) {
                this.reset()
            }
        },
        clear () {
            this.reset()
        },
        reset () {
            this.$refs.form.reset()
        },
        validate () {
            this.$refs.form.validate()
        },
        rules (row) {
            if (row.required) {
                // is required
                return [(v) => {
                    return !!v || row.label + ' is required'
                }]
            } else {
                // no rules
                return []
            }
        },
        formattedLabel (row) {
            return row.required ? `* ${row.label}` : row.label
        },
        onInput (msg) {
            if (msg.payload) {
                const payload = msg.payload
                for (const key in payload) {
                    this.input[key] = payload[key]
                }
                this.$nextTick(() => { this.validate() })
            }
        },
        onDynamicProperties (msg) {
            const updates = msg.ui_update
            if (updates) {
                this.updateDynamicProperty('label', updates.label)
                this.updateDynamicProperty('options', updates.options)
                this.updateDynamicProperty('dropdownOptions', updates.dropdownOptions)
            }
        },
        filteredDropdownOptions (dropdownName) {
            return this.dropdownOptions.filter(obj => obj.dropdown === dropdownName)
        }
    }
}
</script>

<style scoped>
</style>
