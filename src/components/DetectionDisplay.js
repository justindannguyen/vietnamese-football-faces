import React, { Component } from 'react';
import { styles } from './DetectionDisplayStyle'
import { withStyles } from '@material-ui/core/styles';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import { round } from './../utils/Number'
import { Mqtt } from './../utils/Mqtt'
import { mqttConfig } from './../config'

class DetectionDisplay extends Component {
  constructor(props) {
    super(props)
    this.state = {
      data: []
    }
  }

  getItemComponent = face => {
    const { classes } = this.props
    const age = round(face.age, 0)
    const name = face.faceName
    const image = face.faceBase64
    const gender = round(face.genderProbability * 100, 1)
    const genderStr = `${face.gender}(${gender}%)`
    return (
      <ListItem key={face.date} alignItems="center">
        <ListItemAvatar>
          <Avatar alt={name} src={image} className={classes.bigAvatar} />
        </ListItemAvatar>
        <ListItemText
          primary={name}
          secondary={
            <React.Fragment>
              {`${genderStr} — ${age} years old — feeling ${face.expression}`}
            </React.Fragment>
          }
        />
      </ListItem>
    )
  }

  updateVisitorNames = names => {
    const { data } = this.state
    names.forEach(name => {
      data.unshift(name)
    })
    var count = data.length - Math.abs(window.innerHeight / 95)
    for (let i = 0; i < count; i++) {
      data.pop()
    }
    this.setState({
      ...this.state,
      data
    })
  }

  handleMqttMessages = message => {
    try {
      const json = JSON.parse(message.toString())
      this.updateVisitorNames([json])
    } catch (syntaxError) {
      //Skip in case of json is not correct
      console.log(syntaxError)
    }
  }

  componentWillUnmount() {
    this.mqtt.unsubscribe(mqttConfig.analysisTopic)
    this.mqtt.disconnect()
  }

  componentDidMount() {
    this.mqtt = new Mqtt(mqttConfig.broker, mqttConfig.options)
    this.mqtt.connect()
    this.mqtt.subscribe(mqttConfig.analysisTopic, 0, this.handleMqttMessages)
  }

  render() {
    const { classes } = this.props
    return (
      < List className={classes.root} >
        {
          this.props.data.map(this.getItemComponent)
        }
      </List >
    )
  }
}

DetectionDisplay.propTypes = {
}

export default withStyles(styles)(DetectionDisplay);
