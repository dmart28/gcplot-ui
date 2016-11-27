'use strict';

import $ from 'jquery';

import React from 'react';
import { Row, Col, Panel, Tabs, Tab, ButtonGroup, Table, ProgressBar, Input, Modal, Button } from 'react-bootstrap';
import I from 'react-fontawesome';
import GCPlotCore from '../core'
import moment from 'moment-timezone';
import DatePicker from 'react-datepicker';
import TimePicker from 'rc-time-picker';
import {Chart} from 'react-google-charts';
import { browserHistory } from 'react-router'

require('../css/rc-tp-override.css');
require('../css/react-datepicker.css');
var Spinner = require('react-spinkit');
var clipboard = require('clipboard-js');
var update = require('react-addons-update');

class JvmInfoPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = this.initialState();
  }

  hAxis(postfix) {
    if (!postfix) {
      postfix = "";
    }
    return {
      title: 'Time' + postfix,
      viewWindow: {
        min: this.state.pauseDurationRange.from,
        max: this.state.pauseDurationRange.to
      },
      gridlines: {
        count: -1,
        units: {
          days: {format: ['MMM dd']},
          hours: {format: ['HH:mm', 'ha']},
        }
      },
      minorGridlines: {
        units: {
          hours: {format: ['hh:mm:ss a', 'ha']},
          minutes: {format: ['HH:mm a Z', ':mm']}
        }
      }
    };
  }

  initialState() {
    return {
      analyse_id: this.props.params.analyseId,
      jvm_id: this.props.params.jvmId,
      analyse: {
        name: "",
        jvm_ids: [],
        jvm_vers: {},
        jvm_names: {},
        jvm_hdrs: {},
        jvm_gcts: {},
        first_utc: {},
        last_utc: {},
        jvm_mem: {},
        cnts: false,
        tz: null
      },
      dateRangeState: {
        startDate: moment(),
        endDate: moment(),
        timeEnabled: false
      },
      data: [],
      desiredSurvivorSize: -1,
      objectsAges: [],
      concurrentDurationData: [[this.toDateTz(moment()), null, '']],
      logConcurrentDurationData: [[this.toDateTz(moment()), null, '']],
      pauseDurationData: [[this.toDateTz(moment()), null, '', null, '', null, '', null, '']],
      logPauseDurationData: [[this.toDateTz(moment()), null, '', null, '', null, '', null, '']],
      promotionRateData: [[this.toDateTz(moment()), null]],
      allocationRateData: [[this.toDateTz(moment()), null]],
      youngUsedBeforeData: [[this.toDateTz(moment()), null, null]],
      youngUsedAfterData: [[this.toDateTz(moment()), null, null]],
      youngTotalData: [[this.toDateTz(moment()), null, null]],
      tenuredUsedAfterData: [[this.toDateTz(moment()), null, null, null]],
      tenuredTotalData: [[this.toDateTz(moment()), null, null, null]],
      heapUsedBeforeData: [[this.toDateTz(moment()), null, null]],
      heapUsedAfterData: [[this.toDateTz(moment()), null, null]],
      heapTotalData: [[this.toDateTz(moment()), null, null]],
      metaspaceUsage: [[this.toDateTz(moment()), null, null]],
      pauseDurationRange: {
        from: this.toDateTz(moment()),
        to: this.toDateTz(moment())
      },
      isLoading: false,
      show: false,
      delete: {
        message: ""
      },
      reload: {
        message: ""
      }
    };
  }

  toDateTz(mm) {
    return new Date(mm.year(), mm.month(), mm.date(), mm.hour(), mm.minute(), mm.second(), mm.millisecond());
  }

  tz(a) {
    var analyse = a || this.state.analyse;
    if ((typeof analyse.tz) == 'undefined' || analyse.tz == null || analyse.tz == "") {
      return "Africa/Monrovia";
    } else {
      return analyse.tz;
    }
  }

  isFirstEventPresented() {
    var firstEvent = this.state.analyse.first_utc[this.state.jvm_id];
    return ((typeof firstEvent) != 'undefined') && firstEvent != null;
  }

  isLastEventPresented() {
    var lastEvent = this.state.analyse.last_utc[this.state.jvm_id];
    return ((typeof lastEvent) != 'undefined') && lastEvent != null;
  }

  lastEventMoment() {
    var m;
    var lastEvent = this.state.analyse.last_utc[this.state.jvm_id];
    if (this.isLastEventPresented()) {
      m = moment.utc(lastEvent).tz(this.tz());
    }
    return m;
  }

  firstEventMoment() {
    var m;
    var firstEvent = this.state.analyse.first_utc[this.state.jvm_id];
    if (this.isFirstEventPresented()) {
      m = moment.utc(firstEvent).tz(this.tz());
    }
    return m;
  }

  formattedTime(format, mmnt) {
    return mmnt.format(format);
  }

  componentDidUpdate() {
    if (this.state.jvm_id != this.props.params.jvmId || this.state.analyse_id != this.props.params.analyseId) {
      this.updateAll();
    }
  }

  updateAll() {
    this.state.analyse_id = this.props.params.analyseId;
    this.state.jvm_id = this.props.params.jvmId;
    this.state = this.initialState();
    this.componentWillMount();
  }

  componentWillMount() {
    GCPlotCore.analyses((function(r) {
      var analyses = r.analyses;
      for (var i = 0; i < analyses.length; i++) {
        if (analyses[i].id == this.props.params.analyseId) {
          console.log(analyses[i]);
          var lastEvent = analyses[i].last_utc[this.props.params.jvmId];
          var endDate, startDate;
          var tz = this.tz(analyses[i]);
          if (lastEvent) {
            endDate = moment.utc(lastEvent).tz(tz);
            startDate = moment.utc(lastEvent).tz(tz).subtract(1, 'days');
            if (startDate.hours() >= 0 || startDate.minutes() > 0) {
              startDate.subtract(1, 'minutes');
            }
          } else {
            endDate = moment.tz({hour :23, minute :59, second :59, millisecond :999}, tz);
            startDate = moment(endDate, tz).hour(0).minute(0).second(0).millisecond(0).subtract(1, 'days');
          }
          this.state.analyse = analyses[i];
          this.state.dateRangeState = {
            endDate: endDate,
            startDate: startDate
          };
          this.setState(this.state);
          break;
        }
      }
      this.onReloadClick();
    }).bind(this), function(code, title, msg) {
      this.setState(this.state);
      alert(code + "|" + title + "|" + msg);
    }.bind(this));
  }

  componentDidMount() {

  }

  copyIdClick() {
    clipboard.copy(this.props.params.jvmId);
  }

  handleChangeStart(date) {
    this.setState(update(this.state, {
      dateRangeState: {
        startDate: {$set: date}
      }
    }));
  }

  handleChangeEnd(date) {
    this.setState(update(this.state, {
      dateRangeState: {
        endDate: {$set: date}
      }
    }));
  }

  onTimeChange(e) {
    this.setState(update(this.state, {
      dateRangeState: {
        timeEnabled: {$set: e.target.checked}
      }
    }));
  }

  buildTooltip(date, d) {
    var phase;
    if (typeof d.ph != 'undefined') {
      phase = GCPlotCore.PHASES[d.ph];
    } else {
      phase = null;
    }
    return '<dl style="padding: 10px; width: 250px; font-size: 16px"><dt>Time</dt><dd>' + date.format('DD, MMM, YYYY - HH:mm:ss') + '</dd><dt>Pause (Ms)</dt><dd>' +
        (d.p / 1000) + '</dd>' + (phase == null ? '' : '<dt>Phase</dt><dd>' + phase + '</dd>') + '</dl>';
  }

  fillCapacity(jdate, usedBeforeData, usedAfterData, totalData, cp, useAnnotation, annotation) {
    var k = 2/(10 + 1);
    var hbEma, haEma, htEma;
    if (usedBeforeData.length > 1) {
        var i = usedBeforeData.length - 1;
        var incr = useAnnotation ? 1 : 0;
        hbEma = usedBeforeData[i][1 + incr] * k + usedBeforeData[i - 1][2 + incr] * (1 - k);
        haEma = usedAfterData[i][1 + incr] * k + usedAfterData[i - 1][2 + incr] * (1 - k);
        htEma = totalData[i][1 + incr] * k + totalData[i - 1][2 + incr] * (1 - k);
    } else {
        hbEma = cp.b / 1024;
        haEma = cp.a / 1024;
        htEma = cp.t / 1024;
    }
    if (!useAnnotation) {
      usedBeforeData.push([jdate, cp.b / 1024, hbEma]);
      usedAfterData.push([jdate, cp.a / 1024, haEma]);
      totalData.push([jdate, cp.t / 1024, htEma]);
    } else {
      usedBeforeData.push([jdate, annotation, cp.b / 1024, hbEma]);
      usedAfterData.push([jdate, annotation, cp.a / 1024, haEma]);
      totalData.push([jdate, annotation, cp.t / 1024, htEma]);
    }
  }

  onReloadClick() {
    var start = moment(this.state.dateRangeState.startDate, this.tz());
    var end = moment(this.state.dateRangeState.endDate, this.tz());

    if (!this.state.dateRangeState.timeEnabled) {
        start.hour(0).minute(0).second(0).millisecond(0);
        end.hour(23).minute(59).second(59).millisecond(999);
    }

    console.log("start f: " + start.format());
    console.log("end f: " + end.format());
    console.log("start d: " + this.toDateTz(start));
    console.log("end d: " + this.toDateTz(end));
    console.log("start: " + start.valueOf());
    console.log("end: " + end.valueOf());

    this.setState(update(this.state, {
        isLoading: {$set: true},
        reload: {
            message: {$set: ""}
        }
    }));

    var concDurationData = [];
    var logConcDurationData = [];
    var pauseDurationData = [];
    var logPauseDurationData = [];

    var youngUsedBeforeData = [];
    var youngTotalData = [];
    var youngUsedAfterData = [];
    var tenuredUsedBeforeData = [];
    var tenuredTotalData = [];
    var tenuredUsedAfterData = [];
    var heapUsedBeforeData = [];
    var heapTotalData = [];
    var heapUsedAfterData = [];
    var allocationRateData = [];
    var promotionRateData = [];

    var metaspaceUsage = [];

    var lastTenured = 0;
    var lastTime, firstTime = null;
    GCPlotCore.lazyGCEvents({
        analyse_id: this.state.analyse_id,
        jvm_id: this.state.jvm_id,
        tz: this.tz(),
        from: start.valueOf(),
        to: end.valueOf()
    }, function(d) {
        if (typeof d.error != 'undefined') {
            this.setState(update(this.state, {
                reload: {
                    message: {
                        $set: GCPlotCore.ERRORS[d.error] + " (" + d.message + ")"
                    }
                }
            }));
        } else {
            if (typeof d.stats == 'undefined' && typeof d.alr == 'undefined') {
              if (d.g.length == 0)
                  return;
              if (firstTime == null) {
                  firstTime = moment.utc(d.d).tz(this.tz());
              }
              lastTime = moment.utc(d.d).tz(this.tz());
              var jdate = this.toDateTz(lastTime);
              // if not concurrent
              var tt = this.buildTooltip(lastTime, d);
              if (typeof d.c == 'undefined') {
                if (d.g.length == 1) {
                    if ($.inArray(GCPlotCore.YOUNG_GEN, d.g) >= 0) {
                        var hasYoung = typeof d.cp != 'undefined';
                        var hasTotal = typeof d.tc != 'undefined';
                        if (hasYoung) {
                            this.fillCapacity(jdate, youngUsedBeforeData, youngUsedAfterData, youngTotalData, d.cp);
                        }
                        if (hasTotal) {
                            this.fillCapacity(jdate, heapUsedBeforeData, heapUsedAfterData, heapTotalData, d.tc);
                        }
                        if (hasYoung && hasTotal) {
                          this.fillCapacity(jdate, tenuredUsedBeforeData, tenuredUsedAfterData, tenuredTotalData, {
                            b: Math.max(d.tc.b - d.cp.b, 0),
                            a: Math.max(d.tc.a - d.cp.a, 0),
                            t: Math.max(d.tc.t - d.cp.t, 0)
                          }, true, lastTenured > 0 ? '' : null);
                          if (lastTenured > 0) lastTenured = 0;
                        }
                        logPauseDurationData.push([jdate, Math.log10(d.p / 1000), tt, null, tt, null, tt, null, tt]);
                        pauseDurationData.push([jdate, d.p / 1000, tt, null, tt, null, tt, null, tt]);
                    } else if ($.inArray(GCPlotCore.TENURED_GEN, d.g) >= 0) {
                        lastTenured = d.d;
                        logPauseDurationData.push([jdate, null, tt, Math.log10(d.p / 1000), tt, null, tt,null, tt]);
                        pauseDurationData.push([jdate, null, tt, d.p / 1000, tt, null, tt, null, tt]);
                    } else if ($.inArray(GCPlotCore.METASPACE_GEN, d.g) >= 0) {
                        logPauseDurationData.push([jdate, null, tt, null, tt, Math.log10(d.p / 1000), tt, null, tt]);
                        pauseDurationData.push([jdate, null, tt, null, tt, d.p / 1000, tt, null, tt]);
                        if (typeof d.cp != 'undefined' && d.cp != null) {
                            metaspaceUsage.push([jdate, d.cp.b, d.cp.a]);
                        }
                    }
                } else {
                    logPauseDurationData.push([jdate, null, tt, null, tt, null, tt, Math.log10(d.p / 1000), tt]);
                    pauseDurationData.push([jdate, null, tt, null, tt, null, tt, d.p / 1000, tt]);
                    if (typeof d.ecp != 'undefined') {
                        var msc = d.ecp[GCPlotCore.METASPACE_GEN_STR];
                        if (typeof msc != 'undefined' && msc != null) {
                            metaspaceUsage.push([jdate, msc.b, msc.a]);
                        }
                    }
                }
              } else {
                  concDurationData.push([jdate, d.p / 1000, tt]);
                  logConcDurationData.push([jdate, Math.log10(d.p / 1000), tt]);
              }
          } else if (typeof d.alr != 'undefined') {
            var jdate = this.toDateTz(moment.utc(d.d).tz(this.tz()));
            allocationRateData.push([jdate, d.alr / 1024]);
            promotionRateData.push([jdate, d.prr / 1024]);
          }
        }
    }.bind(this), function(err) {
        this.setState(update(this.state, {
            reload: {
                message: {
                    $set: GCPlotCore.ERRORS[r.error] + "(" + d.message + ")"
                }
            }
        }));
    }.bind(this), function() {
        if ((typeof firstTime == 'undefined') || firstTime == null) {
            firstTime = moment.tz(this.tz());
            lastTime = moment(firstTime);
        }

        if (pauseDurationData.length == 0) {
          pauseDurationData = [[this.toDateTz(moment()), null, '', null, '', null, '', null, '']];
          logPauseDurationData = pauseDurationData;
        }
        if (concDurationData.length == 0) {
          concDurationData = [[this.toDateTz(moment()), null, '']];
          logConcDurationData = concDurationData;
        }
        if (allocationRateData.length == 0) {
          promotionRateData = [[this.toDateTz(moment()), null]];
          allocationRateData = promotionRateData;
        }
        if (youngUsedBeforeData.length == 0) {
          youngUsedBeforeData = [[this.toDateTz(moment()), null, null]];
          youngUsedAfterData = youngUsedBeforeData;
          youngTotalData = youngUsedBeforeData;
        }
        if (heapUsedBeforeData.length == 0) {
          heapUsedBeforeData = [[this.toDateTz(moment()), null, null]];
          heapUsedAfterData = heapUsedBeforeData;
          heapTotalData = heapUsedBeforeData;
        }
        if (tenuredUsedBeforeData.length == 0) {
          tenuredUsedBeforeData = [[this.toDateTz(moment()), null, null, null]];
          tenuredUsedAfterData = heapUsedBeforeData;
          tenuredTotalData = heapUsedBeforeData;
        }
        if (metaspaceUsage.length == 0) {
          metaspaceUsage = [[this.toDateTz(moment()), null, null]];
        }
        this.setState(update(this.state, {
            pauseDurationData: {
                $set: pauseDurationData
            },
            logPauseDurationData: {
                $set: logPauseDurationData
            },
            concurrentDurationData: {
                $set: concDurationData
            },
            logConcurrentDurationData: {
                $set: logConcDurationData
            },
            promotionRateData: {
                $set: promotionRateData
            },
            allocationRateData: {
                $set: allocationRateData
            },
            youngUsedBeforeData: {
                $set: youngUsedBeforeData
            },
            youngUsedAfterData: {
                $set: youngUsedAfterData
            },
            youngTotalData: {
                $set: youngTotalData
            },
            heapUsedBeforeData: {
                $set: heapUsedBeforeData
            },
            heapUsedAfterData: {
                $set: heapUsedAfterData
            },
            heapTotalData: {
                $set: heapTotalData
            },
            tenuredUsedAfterData: {
                $set: tenuredUsedAfterData
            },
            tenuredTotalData: {
                $set: tenuredTotalData
            },
            metaspaceUsage: {
                $set: metaspaceUsage
            },
            pauseDurationRange: {
                from: {
                    $set: this.toDateTz(lastTime)
                },
                to: {
                    $set: this.toDateTz(firstTime)
                }
            },
            isLoading: {
                $set: false
            }
        }));
    }.bind(this));
    GCPlotCore.objectsAges(this.state.analyse_id, this.state.jvm_id, function(r) {
      var oas = [];
      var dss = -1;
      if (typeof r.dss != 'undefined' && r.dss > 0) {
        dss = r.dss;
      }
      for  (var i = 0; i < r.occupied.length; i++) {
        oas.push([r.occupied[i], r.total[i]]);
      }
      this.setState(update(this.state, {
        desiredSurvivorSize: {$set: dss},
        objectsAges: {$set: oas}
      }));
    }.bind(this), function(code, title, msg) {
      this.setState(update(this.state, {
        objectsAges: {$set: [["Error", title + " (" + msg + ")"]]}
      }));
    }.bind(this));
  }

  onDeleteJvmClick() {
    this.setState(update(this.state, {
      delete: {
        message: {$set: ""},
      }
    }));
    GCPlotCore.deleteJvm(this.props.params.analyseId, this.props.params.jvmId, function() {
      this.setState(update(this.state, { show: {$set: false}}))
      browserHistory.push("/dashboard");
    }.bind(this), function(code, title, msg) {
      this.setState(update(this.state, {
        delete: {
          message: {$set: title + " (" + msg + ")"},
        }
      }));
    }.bind(this));
  }

  render() {
    let close = () => this.setState(update(this.state, {
        show: {
            $set: false
        }
    }));
    return (
        <div className="content-wrapper">
            <section className="content-header">
                <h1>
                    JVM Info
                    <small>
                        <span style={{
                            color: "#3c8dbc"
                        }}>{this.state.analyse.jvm_names[this.props.params.jvmId]}</span>
                        from {this.state.analyse.name}</small>
                </h1>
            </section>
            <section className="content">
                <Panel footer={< div > <Row>
                    <Col md={2}>
                        <Button type="button" bsStyle="default" disabled={this.state.isLoading} onClick={this.onReloadClick.bind(this)}>{(() => {
                                if (this.state.isLoading) {
                                    return <Spinner spinnerName="circle"/>
                                } else {
                                    return <div>Reload</div>
                                }
                            })()}</Button>
                    </Col>
                    <Col style={this.state.errorStyle} md={6}>
                        <div style={{
                            display: this.state.reload.message == ''
                                ? 'none'
                                : 'block'
                        }} className="callout callout-danger">
                            <p>{this.state.reload.message}</p>
                        </div>
                    </Col>
                </Row> < /div>}>
                    <Row>
                        <Col md={4}>
                            <p>
                                <b>Dates Range:</b>
                            </p>
                            <DatePicker selected={this.state.dateRangeState.startDate} selectsStart startDate={this.state.dateRangeState.startDate} endDate={this.state.dateRangeState.endDate} onChange={this.handleChangeStart.bind(this)}/>
                            <DatePicker selected={this.state.dateRangeState.endDate} selectsEnd startDate={this.state.dateRangeState.startDate} endDate={this.state.dateRangeState.endDate} onChange={this.handleChangeEnd.bind(this)}/>
                        </Col>
                        <Col md={5}>
                            <p>
                                <b>Times Range:</b>
                            </p>
                            <input type="checkbox" className="col-xs-1" value={this.state.dateRangeState.timeEnabled} onChange={this.onTimeChange.bind(this)}/>
                            <TimePicker disabled={!this.state.dateRangeState.timeEnabled} value={this.state.dateRangeState.startDate} onChange={this.handleChangeStart.bind(this)}/>
                            <TimePicker disabled={!this.state.dateRangeState.timeEnabled} value={this.state.dateRangeState.endDate} onChange={this.handleChangeEnd.bind(this)}/>
                        </Col>
                    </Row>
                </Panel>
                <Tabs defaultActiveKey={1}>
                    <Tab eventKey={1} title="General Stats">
                        <Row>
                            <Col md={12}>
                                <Panel header={< span > <I name="info"/>Brief Info < /span>}>
                                    <dl>
                                        <dt>Name</dt>
                                        <dd>
                                            <code>{this.state.analyse.jvm_names[this.props.params.jvmId]}</code>
                                        </dd>
                                        <dt>First GC Event Occured</dt>
                                        {(() => {
                                            if (this.isFirstEventPresented()) {
                                                return <dd>{this.formattedTime("MMMM DD, YYYY (hh:mm:ss A)", this.firstEventMoment())}
                                                    - {this.tz()}</dd>
                                            } else {
                                                return <dd>There is no info about the first GC Event observed.</dd>
                                            }
                                        })()}
                                        <dt>Last GC Event Time</dt>
                                        {(() => {
                                            if (this.isLastEventPresented()) {
                                                return <dd>{this.formattedTime("MMMM DD, YYYY (hh:mm:ss A)", this.lastEventMoment())}
                                                    - {this.tz()}</dd>
                                            } else {
                                                return <dd>There is no info about the last GC Event observed.</dd>
                                            }
                                        })()}
                                        <dt>Analyse Type</dt>
                                        {(() => {
                                            if (this.state.analyse.cnts) {
                                                return <dd>Continuous, with Realtime Connection support.</dd>
                                            } else {
                                                return <dd>Single Log file.</dd>
                                            }
                                        })()}
                                    </dl>
                                </Panel>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Panel header={< span > <I name="server"/>Last Server Info < /span>}>
                                    {(() => {
                                        if (this.state.analyse.jvm_mem[this.props.params.jvmId]) {
                                            return (
                                                <dl>
                                                    <dt>Page Size</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].ps)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].ps}
                                                        bytes)</dd>
                                                    <dt>Physical Total</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].pt)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].pt}
                                                        bytes)</dd>
                                                    <dt>Physical Free</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].pf)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].pf}
                                                        bytes)</dd>
                                                    <dt>Physical Occupied</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].pt - this.state.analyse.jvm_mem[this.props.params.jvmId].pf)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].pt - this.state.analyse.jvm_mem[this.props.params.jvmId].pf}
                                                        bytes)</dd>
                                                    <dt>Swap Total</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].st)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].st}
                                                        bytes)</dd>
                                                    <dt>Swap Free</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].sf)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].sf}
                                                        bytes)</dd>
                                                    <dt>Swap Occupied</dt>
                                                    <dd>
                                                        <code>{GCPlotCore.humanFileSize(this.state.analyse.jvm_mem[this.props.params.jvmId].st - this.state.analyse.jvm_mem[this.props.params.jvmId].sf)}</code>
                                                        ({this.state.analyse.jvm_mem[this.props.params.jvmId].st - this.state.analyse.jvm_mem[this.props.params.jvmId].sf}
                                                        bytes)</dd>
                                                </dl>
                                            );
                                        } else {
                                            return <dd>No info recorded. Probably the file was truncated or corrupted.</dd>
                                        }
                                    })()}
                                </Panel>
                            </Col>
                            <Col md={6}>
                                <Panel header={< span > <I name="flag"/>JVM Flags < /span>}>
                                    {(() => {
                                        if (this.state.analyse.jvm_hdrs[this.props.params.jvmId]) {
                                            return (
                                                <code>{this.state.analyse.jvm_hdrs[this.props.params.jvmId]}</code>
                                            );
                                        } else {
                                            return <dd>No info recorded. Probably the file was truncated or corrupted.</dd>
                                        }
                                    })()}
                                </Panel>
                            </Col>
                        </Row>
                    </Tab>
                    <Tab eventKey={2} title="Pauses">
                        <Panel><Chart chartType="ScatterChart" options={{
            displayAnnotations: true,
            title: 'Pause Durations (Stop-The-World only)',
            tooltip: {
                isHtml: true
            },
            hAxis: this.hAxis(),
            vAxis: {
                title: 'GC Pause (milliseconds)'
            },
            series: {
                0: {
                    pointShape: 'circle'
                },
                1: {
                    pointShape: 'triangle'
                },
                2: {
                    pointShape: 'star'
                },
                3: {
                    pointShape: 'polygon'
                }
            }
        }} rows={this.state.pauseDurationData} columns={[
            {
                'type': 'datetime',
                'label': 'Time'
            }, {
                'type': 'number',
                'label': 'Young Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Tenured Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Metaspace/Perm Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Full Pause (Young + Tenured + Metaspace/Perm)'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }
        ]} graph_id="pdc" width="100%" height="400px" legend_toggle={false}/><Chart chartType="ScatterChart" options={{
            displayAnnotations: true,
            title: 'Log(x) Pause Durations (Stop-The-World only)',
            tooltip: {
                isHtml: true
            },
            hAxis: this.hAxis(),
            vAxis: {
                title: 'Log(GC_Pause)'
            },
            series: {
                0: {
                    pointShape: 'circle'
                },
                1: {
                    pointShape: 'triangle'
                },
                2: {
                    pointShape: 'star'
                },
                3: {
                    pointShape: 'polygon'
                }
            }
        }} rows={this.state.logPauseDurationData} columns={[
            {
                'type': 'datetime',
                'label': 'Time'
            }, {
                'type': 'number',
                'label': 'Young Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Tenured Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Metaspace/Perm Pause'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }, {
                'type': 'number',
                'label': 'Full Pause (Young + Tenured + Metaspace/Perm)'
            }, {
                'type': 'string',
                'role': 'tooltip',
                'p': {
                    'html': true
                }
            }
        ]} graph_id="lpdc" width="100%" height="400px" legend_toggle={false}/>
                            <Chart chartType="ScatterChart" options={{
                                displayAnnotations: true,
                                title: 'Concurrent Pause Durations (Non-STW)',
                                tooltip: {
                                    isHtml: true
                                },
                                hAxis: this.hAxis(),
                                vAxis: {
                                    title: 'GC Duration (Milliseconds)'
                                },
                                series: {
                                    0: {
                                        pointShape: 'circle'
                                    }
                                }
                            }} rows={this.state.concurrentDurationData} columns={[
                                {
                                    'type': 'datetime',
                                    'label': 'Time'
                                }, {
                                    'type': 'number',
                                    'label': 'Concurrent Collections'
                                }, {
                                    'type': 'string',
                                    'role': 'tooltip',
                                    'p': {
                                        'html': true
                                    }
                                }
                            ]} graph_id="conc_events" width="100%" height="400px" legend_toggle={false}/>
                            <Chart chartType="ScatterChart" options={{
                                displayAnnotations: true,
                                title: 'Log(x) Concurrent Pause Durations (Non-STW)',
                                tooltip: {
                                    isHtml: true
                                },
                                hAxis: this.hAxis(),
                                vAxis: {
                                    title: 'Log(GC_Duration)'
                                },
                                series: {
                                    0: {
                                        pointShape: 'circle'
                                    }
                                }
                            }} rows={this.state.logConcurrentDurationData} columns={[
                                {
                                    'type': 'datetime',
                                    'label': 'Time'
                                }, {
                                    'type': 'number',
                                    'label': 'Concurrent Collections'
                                }, {
                                    'type': 'string',
                                    'role': 'tooltip',
                                    'p': {
                                        'html': true
                                    }
                                }
                            ]} graph_id="lconc_events" width="100%" height="400px" legend_toggle={false}/>
                        </Panel>
                    </Tab>
                    <Tab eventKey={3} title="Memory">
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Promotion Rate',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Promotion Rate (mb/sec)'
                            }
                        }} rows={this.state.promotionRateData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Promotion Rate'
                            }
                        ]} graph_id="prmc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Allocation Rate',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Allocation Rate (mb/sec)'
                            }
                        }} rows={this.state.allocationRateData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Allocation Rate'
                            }
                        ]} graph_id="armc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Young Generation Used Before GC',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Young Used Before (mb)'
                            }
                        }} rows={this.state.youngUsedBeforeData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Young Used Before'
                            }, {
                                'type': 'number',
                                'label': 'Young Used Before EMA'
                            }
                        ]} graph_id="yubc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Young Generation Used After GC',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Young Used After (mb)'
                            }
                        }} rows={this.state.youngUsedAfterData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Young Used After'
                            }, {
                                'type': 'number',
                                'label': 'Young Used After EMA'
                            }
                        ]} graph_id="yuac" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Young Total Size',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Young Total (mb)'
                            }
                        }} rows={this.state.youngTotalData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Young Total'
                            }, {
                                'type': 'number',
                                'label': 'Young Total EMA'
                            }
                        ]} graph_id="yutc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            annotations: {
                              stemColor: 'red'
                            },
                            colors: ['#3366CC', '#AAAA11'],
                            title: 'Tenured Used',
                            hAxis: this.hAxis(" | Tenured Occured (red lines)"),
                            vAxis: {
                                title: 'Tenured Used (mb)'
                            }
                        }} rows={this.state.tenuredUsedAfterData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {type: 'string', role: 'annotation'}, {
                                'type': 'number',
                                'label': 'Tenured Used'
                            }, {
                                'type': 'number',
                                'label': 'Tenured Used EMA'
                            }
                        ]} graph_id="tuac" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Tenured Total Size',
                            annotations: {
                              stemColor: 'red'
                            },
                            colors: ['#3366CC', '#AAAA11'],
                            hAxis: this.hAxis(" | Tenured Occured (red lines)"),
                            vAxis: {
                                title: 'Tenured Total (mb)'
                            }
                        }} rows={this.state.tenuredTotalData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {type: 'string', role: 'annotation'}, {
                                'type': 'number',
                                'label': 'Tenured Total'
                            }, {
                                'type': 'number',
                                'label': 'Tenured Total EMA'
                            }
                        ]} graph_id="tutc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="ScatterChart" options={{
                            displayAnnotations: true,
                            title: 'Metaspace Used Before and After',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Metaspact Used (mb)'
                            },
                            series: {
                                0: {
                                    pointShape: 'circle'
                                },
                                1: {
                                    pointShape: 'triangle'
                                }
                            }
                        }} rows={this.state.metaspaceUsage} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Used Before'
                            }, {
                                'type': 'number',
                                'label': 'Used After'
                            }
                        ]} graph_id="mutc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Heap Used Before GC',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Heap Used Before (mb)'
                            }
                        }} rows={this.state.heapUsedBeforeData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Heap Used Before'
                            }, {
                                'type': 'number',
                                'label': 'Heap Used Before EMA'
                            }
                        ]} graph_id="hubc" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Heap Used After GC',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Heap Used After (mb)'
                            }
                        }} rows={this.state.heapUsedAfterData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Heap Used After'
                            }, {
                                'type': 'number',
                                'label': 'Heap Used After EMA'
                            }
                        ]} graph_id="huac" width="100%" height="400px" legend_toggle={false}/>
                        <Chart chartType="LineChart" options={{
                            displayAnnotations: true,
                            title: 'Heap Total Size',
                            hAxis: this.hAxis(),
                            vAxis: {
                                title: 'Heap Total (mb)'
                            }
                        }} rows={this.state.heapTotalData} columns={[
                            {
                                'type': 'datetime',
                                'label': 'Time'
                            }, {
                                'type': 'number',
                                'label': 'Heap Total'
                            }, {
                                'type': 'number',
                                'label': 'Heap Total EMA'
                            }
                        ]} graph_id="hutc" width="100%" height="400px" legend_toggle={false}/>
                    </Tab>
                    <Tab eventKey={4} title="Tenuring Stats">
                        <Panel header="Tenuring Ages Statistic">
                            {(() => {
                                if (this.state.desiredSurvivorSize > 0) {
                                    return <p>
                                        <b>Desired Survivor Size</b>
                                        -
                                        <code>{GCPlotCore.humanFileSize(this.state.desiredSurvivorSize)}</code>
                                    </p>;
                                } else {
                                    return <div/>;
                                }
                            })()}
                            <Row>
                                <Col md={8}>
                                    <Table bordered>
                                        <thead>
                                            <tr>
                                                <th style={{
                                                    width: '3%'
                                                }}>#</th>
                                                <th style={{
                                                    width: '30%'
                                                }}>Occupied (bytes)</th>
                                                <th style={{
                                                    width: '30%'
                                                }}>Total (bytes)</th>
                                                <th style={{
                                                    width: '30%'
                                                }}>Occupation</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                return this.state.objectsAges.map(function(r, i) {
                                                    return <tr>
                                                        <td>{i + 1}</td>
                                                        <td>{r[0]}</td>
                                                        <td>{r[1]}</td>
                                                        <td>
                                                            <ProgressBar now={Number.isInteger(r[0])
                                                                ? (100 - ((r[1] - r[0] + 1) / r[1] * 100))
                                                                : 0} bsStyle="primary" className="progress-xs"/>
                                                        </td>
                                                    </tr>;
                                                });
                                            })()}
                                        </tbody>
                                    </Table>
                                </Col>
                            </Row>
                        </Panel>
                    </Tab>
                    <Tab eventKey={5} title="Causes & Phases"></Tab>
                    <Tab eventKey={6} title="Performance"></Tab>
                    <Tab eventKey={7} title="Manage">
                        <Modal container={this} show={this.state.show} onHide={close}>
                            <Modal.Header closeButton>
                                <Modal.Title>Confirm Delete</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <h4>Are you sure you want to delete this JVM?</h4>
                                <p>{this.state.delete.message}</p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button bsStyle="danger" onClick={this.onDeleteJvmClick.bind(this)}>Delete</Button>
                                <Button onClick={close}>Close</Button>
                            </Modal.Footer>
                        </Modal>
                        <Input type="text" label="ID" value={this.props.params.jvmId} addonAfter={< I name = "clipboard" style = {{cursor: "pointer"}}onClick = {
                            this.copyIdClick.bind(this)
                        } />} disabled={true}/>
                        <Button className="btn btn-block btn-danger" style={{
                            color: "white"
                        }} onClick={() => this.setState(update(this.state, {
                            show: {
                                $set: true
                            }
                        }))}>Delete JVM</Button>
                    </Tab>
                </Tabs>
            </section>
        </div>
    );
}
}

JvmInfoPage.displayName = 'JvmInfoPage';

JvmInfoPage.defaultProps = {
};

export default JvmInfoPage;
