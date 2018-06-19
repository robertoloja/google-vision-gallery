import React, { Component } from 'react';
import Dropdown from 'react-dropdown-multiselect'
import Gallery from 'react-photo-gallery'
import request from 'request'
import data from './data.json'
import './App.css';
const API_KEY = 'AIzaSyD08gK4MgBbAtVfYNXy0pVF6EgL7fPfimQ'



class App extends Component {
  constructor() {
    super()
    this.state = {
      allLabels: new Set(),
      options: [],
      selected: [],
    }

    this.state.images = data.imageFiles.map(x => {
      return {
        'imgUrl': this.getPublicUrl(x),
        'bucketUrl': this.getBucketUrl(x),
        'labels': []
      }
    })
  }

  getPublicUrl(fileName) {
    return "https://storage.googleapis.com/" + fileName
  }

  getBucketUrl(fileName) {
    return "gs://" + fileName
  }

  _onSelect(option) {
    this.setState({selected: option})
  }

  getSelected() {
    return this.state.selected.map((x) => x.value)
  }

  componentDidMount() {
    this.state
        .images
        .map(image => this.getLabels(image)
                          .then((labels) => {
                            const onlyLabels = labels.map((labelObj) => labelObj.description);
                            image.labels = onlyLabels;

                            onlyLabels.map((label) => this.state.allLabels.add(label))
                          })
        )
  }

  setDropdownOptions() {
    this.setState({options: Array.from(this.state.allLabels).map((label) => {
      return {value: label, label: label}
      })
    })
  }

  getLabels(image) {
    return new Promise((resolve, reject) => {
      request.post('https://vision.googleapis.com/v1/images:annotate?key=' + API_KEY,
      { 
        json: true,
        body: {
          "requests":  [{ "features":  [ {"type": "LABEL_DETECTION"}], 
          "image": {"source": { "gcsImageUri": image.bucketUrl}}}]
        }
      },
      (err, res, body) => {
        if (err) { return console.log(err); }

        let labels = body.responses[0].labelAnnotations
        resolve(labels)
      });
    })
  }

  foo() {
    console.log(this.state.selected)
  }

  intersects(arr1, arr2) {
    if (arr1.filter((x) => arr2.includes(x)).length !== 0)
      return true;
    else
      return false;
  }

  photosToDisplay() {
    let photos = this.state
                     .images
                     .filter((image) => 
                       this.intersects(image.labels, this.getSelected()))
                     .map((image) => {
                       return {
                         src: image.imgUrl,
                         width: 4,
                         height: 3
                       }
                     })
    return photos;
  }

  render() {

    return (
      <div>
        <div className='navbar'>
          <button className='button' onClick={this.setDropdownOptions.bind(this)}>Refresh available labels</button>
          <Dropdown options={this.state.options} onChange={this._onSelect.bind(this)} 
            value={this.state.selected} placeholder="Labels to filter by..." />
        </div>
        <div className='gallery'>
          <Gallery photos={this.photosToDisplay()} />
        </div>
      </div>
    );
  }
}

export default App;
