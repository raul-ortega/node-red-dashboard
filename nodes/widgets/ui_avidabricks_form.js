module.exports = function (RED) {
    function UIAvidabricksForm (config) {
        RED.nodes.createNode(this, config)
        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        /**
         * Further config & setup to go here
         */
        const evts = {
            onAction: true,
            beforeSend: async function (msg) {
                if (msg?._event === 'submit') {
                    if (msg.payload?.plot === '1') {
                        node.send([msg, null])
                    } else if (msg.payload?.plot === '2') {
                        node.send([null, msg])
                    }
                }
            },
            onInput: async function (msg) {
                node.send(msg)
            }
        }
        // register the widget with Dashboard
        group.register(node, config, evts)
    }
    // Register the node with Node-RED
    RED.nodes.registerType('ui-avidabricks-form', UIAvidabricksForm)
}
