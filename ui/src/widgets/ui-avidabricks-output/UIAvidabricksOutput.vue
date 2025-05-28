<template>
    {{ msg.payload.sequende}}
    <div>
        <!-- Título condicional -->
        <h1 v-if="msg.payload.output_type && msg.payload.output_name">{{ msg.payload.output_name }} {{ msg.payload.output_type }}:</h1>

        <!-- Mensaje de carga -->
        <div v-show="!msg.payload.output_type && !msg.payload.output_name">
            <p style="font-size: 18px; color: #555;">Generating plot, please wait...</p>
        </div>

        <!-- Tabla de datos -->
        <table v-if="msg.payload.output_type && msg.payload.output_name" style="display: block; border-collapse: collapse; font-family: sans-serif; font-size: 14px;">
            <thead>
                <tr style="background-color: #f7f7f7; border-bottom: 2px solid #ccc;">
                    <th style="width: 20%; white-space: nowrap; text-align: left; padding: 8px; border-right: 1px solid #ddd;">Field</th>
                    <th style="text-align: left; padding: 8px;">Value</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="(value, key) in msg.payload" :key="key" v-show="key !== 'output_type' && key !== 'output_name' && key !== 'svg' && key !== 'png'" style="border-bottom: 1px solid #eee;">
                    <td style="padding: 8px; white-space: nowrap; border-right: 1px solid #eee;">{{key}}</td>
                    <td style="padding: 8px; word-break: break-word;">{{value}}</td>
                </tr>
            </tbody>
        </table>

        <!-- Botones de descarga -->
        <div v-if="msg.payload.output_type && msg.payload.output_name" style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
            <button @click="downloadJson()" class="download-button json-button">
                <i class="fa fa-file-code-o"></i> Download JSON
            </button>

            <button @click="downloadCSV()" class="download-button csv-button">
                <i class="fa fa-file-excel-o"></i> Download CSV
            </button>
        </div>

        <!-- Imagen y botón de descarga -->
        <img v-if="msg.payload.svg" :src="'/plots/' + msg.payload.svg" style="display:block; width:100%; margin-bottom: 10px;" />
        <div v-if="msg.payload.svg" style="display: flex; gap: 10px; flex-wrap: wrap;">
            <button v-if="msg.payload.svg" @click="downloadSVG()" class="download-button svg-button">
                <i class="fa fa-file-image-o"></i> Download SVG
            </button>

            <button v-if="msg.payload.png" @click="downloadPNG()" class="download-button png-button">
                <i class="fa fa-file-image-o"></i> Download PNG
            </button>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'UIAvidabricksOutput',
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
                return msg
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
    methods: {
        downloadJson () {
            try {
                const data = this.msg.payload
                if (!data) {
                    console.error('No data available for download')
                    return
                }

                const jsonStr = JSON.stringify(data, null, 2)
                const blob = new Blob([jsonStr], { type: 'application/json' })
                const url = URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = data.output_name + '_data.json'
                document.body.appendChild(a)
                a.click()

                setTimeout(() => {
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }, 100)
            } catch (error) {
                console.error('Error generating JSON:', error);
            }
        },
        jsonToCsv (jsonData) {
            try {
                const items = Array.isArray(jsonData) ? jsonData : [jsonData]
                if (items.length === 0) return ''

                const fields = new Set()
                items.forEach(item => {
                    Object.keys(item).forEach(key => fields.add(key))
                })

                const header = Array.from(fields).join(',')
                const rows = items.map(item => {
                    return Array.from(fields).map(field => {
                        let value = item[field] !== undefined ? item[field] : ''
                        if (typeof value === 'object') {
                            value = JSON.stringify(value)
                        }
                        return `"${String(value).replace(/"/g, '""')}"`
                    }).join(',')
                })

                return [header, ...rows].join('\n');
            } catch (error) {
                console.error('Error converting to CSV:', error);
                return ''
            }
        },
        downloadCSV () {
            try {
                const data = this.msg.payload
                if (!data) {
                    console.error('No data available for download')
                    return
                }

                const csvContent = this.jsonToCsv(data)
                if (!csvContent) {
                    console.error('Could not generate CSV content')
                    return
                }

                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)

                const a = document.createElement('a')
                a.href = url
                a.download = data.output_name + '_data.csv'
                document.body.appendChild(a)
                a.click()
                setTimeout(() => {
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                }, 100)
            } catch (error) {
                console.error('Error generating CSV:', error)
            }
        },
        downloadSVG () {
            try {
                const imageUrl = '/plots/' + this.msg.payload.svg
                const a = document.createElement('a')
                a.href = imageUrl
                a.download = this.msg.payload.svg
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } catch (error) {
                console.error('Error downloading image:', error)
            }
        },
        downloadPNG () {
            try {
                const imageUrl = '/plots/' + this.msg.payload.png
                const a = document.createElement('a')
                a.href = imageUrl
                a.download = this.msg.payload.png
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
            } catch (error) {
                console.error('Error downloading image:', error)
            }
        }
    }
}
</script>

<style>
.download-button {
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.download-button:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
}

.json-button {
  background-color: #28a745;
}

.csv-button {
  background-color: #17a2b8;
}

.svg-button {
  background-color: #28a745;
}

.png-button {
  background-color: #17a2b8;
}

.fa {
  font-size: 16px;
}
</style>
