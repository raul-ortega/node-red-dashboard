<template>
    <div>
        <h3>Payload Recibido</h3>
        <p>
            {{ msg }}
        </p>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'UIExample',
    inject: ['$socket', '$dataTracker'],
    props: {
        id: { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },
    computed: {
        ...mapState('data', ['messages']),
        hasPayload () {
            return this.messages[this.id].payload !== undefined
        },
        msg () {
            const msg = this.messages[this.id]
            if (msg.payload !== undefined) {
                return msg.payload
            } else {
                return null
            }
        }
    },
    created () {
        this.$dataTracker(this.id)
    },
    mounted () {
        this.$socket.on('msg-input' + this.id, (msg) => {
            // do something with the msg
        })
    },
}
</script>

<style scoped>
.ui-widget {
min-width: 200px;
max-width: 100%;
}
</style>
