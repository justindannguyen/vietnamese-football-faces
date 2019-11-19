import React, { Component } from 'react';
import './LiveDetection.css';
import * as faceapi from 'face-api.js';

const options = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 })
const faceDbs = {
  'Thailand\'s 12nd Player': 'https://image.thanhnien.vn/660/uploaded/gianglao/2019_11_19/tt_mczo.jpg',
  'Park': 'https://i-vnexpress.vnecdn.net/2019/11/19/8603e7a920ead9b480fb-2503-1574179044.jpg',
  'Hau': 'https://scontent-hkg3-1.xx.fbcdn.net/v/t1.0-9/53293108_452415241966927_7406538086814842880_n.jpg?_nc_cat=1&_nc_oc=AQlZ26ZrlHJ6qHpsCkWzUVMUlem9BgotQsQao9jtkb5MpWJfSDtlkam_Vnt_8UjItWo&_nc_ht=scontent-hkg3-1.xx&oh=cb5d2e8914ad4736b1b47e0dd1a7be1a&oe=5E441FC2'
}
let faceMatcher
let labelDescriptors = []

class LiveDetection extends Component {
  async init() {
    // Load models
    await faceapi.nets.ssdMobilenetv1.loadFromUri('/models')
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
    await faceapi.nets.ageGenderNet.loadFromUri('/models')
    await faceapi.nets.faceExpressionNet.loadFromUri('/models')
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models')

    // Load pre-trained faces

    for (var name in faceDbs) {
      const img = await faceapi.fetchImage(faceDbs[name])
      const descriptor = await faceapi.detectSingleFace(img, options)
        .withFaceLandmarks()
        .withFaceDescriptor()

      labelDescriptors.push(new faceapi.LabeledFaceDescriptors(
        name, [descriptor.descriptor]))
    }
    faceMatcher = new faceapi.FaceMatcher(labelDescriptors, 0.5)
    // Load screen mirror
    if (navigator.getUserMedia) {
      var displayMediaOptions = {
        video: {
          cursor: "never"
        },
        audio: false
      };
      navigator.mediaDevices
        .getDisplayMedia(displayMediaOptions)
        .then(stream => this.video.srcObject = stream);
    }
  }
  componentDidMount() {
    setTimeout(this.init, 0)
  }

  setRefVideo = video => {
    this.video = video
  }

  onVideoPlayed = () => {
    const canvas = faceapi.createCanvasFromMedia(this.video)
    document.body.append(canvas)
    const screenSettings = this.video.srcObject.getVideoTracks()[0].getSettings();
    const displaySize = { width: screenSettings.width, height: screenSettings.height }
    faceapi.matchDimensions(canvas, displaySize)

    this.intervalId = setInterval(async () => {

      const detections = await faceapi.detectAllFaces(this.video, options)
        .withFaceLandmarks()
        .withAgeAndGender()
        .withFaceExpressions()
        .withFaceDescriptors()
      // Public detections

      // Render detection
      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
      // faceapi.draw.drawDetections(canvas, resizedDetections)
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
      // faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
      resizedDetections.forEach(result => {
        const { age, gender, detection, expressions, descriptor } = result
        const expression = expressions.asSortedArray().shift();
        const bestMatch = faceMatcher.findBestMatch(descriptor)
        const { label } = bestMatch

        const bottomLeft = result.detection.box.bottomLeft
        new faceapi.draw.DrawBox(detection.box, { label: label !== 'unknown' ? label : '' }).draw(canvas)
        new faceapi.draw.DrawTextField(
          [
            `${expression.expression}`,
            `${faceapi.round(age + 1, 0)} years`,
            `${gender}`
          ],
          bottomLeft
        ).draw(canvas)
      })
      canvas.style = `top: ${this.video.offsetTop}px; left: ${this.video.offsetLeft}px`
    }, 100)
  }

  componentWillUnmount() {
    if (this.intervalId)
      clearInterval(this.intervalId)
  }

  render() {
    return (
      <div className="liveCam" >
        <video id="video"
          onPlay={this.onVideoPlayed}
          ref={this.setRefVideo}
          autoPlay muted />
      </div>
    );
  }
}

export default LiveDetection;