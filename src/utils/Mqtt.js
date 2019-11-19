import mqtt from 'mqtt'

export class Mqtt {
  constructor(broker = 'ws://localhost:15675/ws', options) {
    this.broker = broker
    this.connectionOptions = options
    this.topics = {}
  }

  connect() {
    if (this.isConnected()) {
      return
    }
    this.mqttClient = mqtt.connect(
      this.broker,
      this.connectionOptions
    )
    this.mqttClient.on('message', this.handleMessages)
    this.mqttClient.on('connect', () =>
      Object.keys(this.topics).forEach(topic => {
        const subscriptions = this.topics[topic]
        subscriptions && this.mqttClient.subscribe(topic, { qos: subscriptions.qos })
      })
    )
  }

  handleMessages = (topic, message) => {
    const subscriptions = this.topics[topic]
    subscriptions && subscriptions.handlers.forEach(handler => handler(message))
  }

  disconnect() {
    this.mqttClient && this.mqttClient.end()
    this.topics = {}
  }

  subscribe(topic, qos, handler) {
    let subscriptions = this.topics[topic]
    if (subscriptions == null) {
      subscriptions = { qos, handlers: [] }
      if (this.isConnected()) {
        this.mqttClient.subscribe(topic, { qos })
      }
    }
    subscriptions.handlers.push(handler)
    this.topics = { ...this.topics, [topic]: subscriptions }
  }

  isConnected() {
    return this.mqttClient && this.mqttClient.connected
  }

  unsubscribe(topic) {
    this.topics = { ...this.topics, [topic]: null }
    if (this.isConnected()) {
      this.mqttClient.unsubscribe(topic)
    }
  }
}
