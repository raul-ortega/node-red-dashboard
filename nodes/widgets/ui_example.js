module.exports = function (RED) {
    function UIExampleNode (config) {
        RED.nodes.createNode(this, config)
        const node = this

        // which group are we rendering this widget
        const group = RED.nodes.getNode(config.group)

        /**
         * Further config & setup to go here
         */
        const evts = {
            onAction: true,
            onInput: async function (msg) {
                node.send(msg)
            }
        }
        // register the widget with Dashboard
        group.register(node, config, evts)
    }
    // Register the node with Node-RED
    RED.nodes.registerType('ui-example', UIExampleNode)
}
