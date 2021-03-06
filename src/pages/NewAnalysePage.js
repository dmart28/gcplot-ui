'use strict';

import React from 'react';
import { Row, Col, Panel, FormControl, FormGroup, ButtonInput, Popover, Modal, Button, DropdownButton, MenuItem } from 'react-bootstrap';
import I from 'react-fontawesome';
import CreateJvm from '../components/Jvm/CreateJvm'
import GCPlotCore from '../core'
import TimezonePicker from '../tz_dist/react-bootstrap-timezone-picker.js';
import '../tz_dist/react-bootstrap-timezone-picker.min.css';

var update = require('react-addons-update');

class NewAnalysePage extends React.Component {
  constructor(props) {
      super(props);
      this.state = {
        jvms: [],
        lastId: 0,
        cmps: {},
        errorStyle: {
            display: "none",
            value: "",
            color: 'red'
        },
        createDisabled: false
      };
  }

  componentWillMount() {

  }

  componentWillUnmount() {

  }

  addJvmClicked(e) {
    var newId = this.state.lastId + 1;
    var newElement = <CreateJvm md={3} cid={newId} key={newId} pp={this} closeClickHandler={this.jvmCloseClicked.bind(this, newId)}></CreateJvm>;
    this.setState(update(this.state, {
      jvms: { $push: [newElement] },
      lastId: { $set: newId }
    }));
    e.preventDefault();
  }

  jvmCloseClicked(cid) {
    var jvms = [];
    for (var i = 0; i < this.state.jvms.length; i++) {
      if (this.state.jvms[i].props.cid != cid) {
        jvms.push(this.state.jvms[i]);
      }
    }
    this.setState(update(this.state, {
      jvms: { $set: jvms }
    }));
  }

  createClicked() {
    if (this.nameText.value.length == 0) {
      this.setState(update(this.state, {
        errorStyle: {
            display: {$set: "block"},
            value: {$set: "Name should not be empty!"},
            createDisabled: {$set: false}
        }
      }));
    } else {
      this.setState(update(this.state, {
        createDisabled: {$set: true}
      }));
      var req = {
        name: this.nameText.value,
        cnts: true,
        tz: this.tzPicker.prevValue,
        source_type: "NONE",
        source_config: "",
        ext: ""
      };
      var jvms = [];
      for (var i = 0; i < this.state.jvms.length; i++) {
        var jvm = this.state.cmps[this.state.jvms[i].props.cid + ""];
        jvms.push({
          id: jvm.state.jvmId,
          an_id: "",
          name: jvm.jvmNameText.value,
          vm_ver: parseInt(jvm.versionSelector.value),
          gc_type: parseInt(jvm.typeSelector.value),
          headers: ""
        });
      }
      req["jvms"] = jvms;
      GCPlotCore.addAnalyse(req, function() {
        GCPlotCore.history.push("/dashboard");
      }, (function(code, title, msg) {
        this.setState(update(this.state, {
          errorStyle: {
              display: {$set: "block"},
              value: {$set: title + " (" + msg + ")"},
              createDisabled: {$set: false}
          }
        }));
      }).bind(this));
    }
  }

  render() {
    return (
      <div className="content-wrapper">
        <section className="content-header">
          <h1>
            Analysis Group
            </h1>
      </section>
      <section className="content">
      <Row style={{padding: "5px"}}>
        <Col>
        <Panel header="Create New" footer={<div>
          <p style={this.state.errorStyle}>{this.state.errorStyle.value}</p>
          <Button type="button" disabled={this.state.createDisabled} bsStyle="primary" onClick={this.createClicked.bind(this)}>Create</Button>
        </div>}>
          <form role="form">
            <FormGroup><FormControl type="text" label="Display Name" placeholder="Enter name" inputRef={(r) => this.nameText = r} /></FormGroup>
            <label htmlFor="tzSelect">Timezone</label>
            <p>
            <TimezonePicker
              absolute      = {false}
              defaultValue  = "Africa/Monrovia"
              placeholder   = "Timezone:"
              id            = "tzSelect"
              style         = {{width: "100%"}}
              ref           = {(r) => this.tzPicker = r}
            />
            </p>
            <button className="btn btn-block btn-info btn-xs" style={{width: "100px"}} onClick={this.addJvmClicked.bind(this)}>Add JVM</button>
            <p />
          </form>
          <Row ref={(r) => this.jvmsRow = r}>
          { this.state.jvms }
          </Row>
        </Panel>
        </Col>
        </Row>
        </section>
      </div>
    );
  }
}

NewAnalysePage.displayName = 'NewAnalysePage';

NewAnalysePage.defaultProps = {
};

export default NewAnalysePage;
