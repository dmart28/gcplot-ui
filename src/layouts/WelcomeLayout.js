import React from 'react';
import GCPlotCore from '../core'

var update = require('react-addons-update');
var Recaptcha = require('react-recaptcha');
var Spinner = require('react-spinkit');

class WelcomeLayout extends React.Component {
    constructor(props) {
        super(props);
        require('../styles/skeleton/custom.css');
        require('../styles/skeleton/normalize.css');
        require('../styles/skeleton/skeleton.css');

        this.state = {
            loginErrorStyle: {
                display: "none",
                value: "",
                color: 'red'
            },
            signupErrorStyle: {
                display: "hidden",
                value: "",
                color: 'red'
            },
            captchaVerified: false,
            submitProgress: false,
            loginProgress: false
        };
        this.verifyCallback = this.verifyCallback.bind(this);
    }

    onloadCallback() {}

    updateState(delta) {
        this.setState(update(this.state, delta));
    }

    verifyCallback(resp) {
        if (resp.length > 0) {
            this.updateState({
                captchaVerified: {
                    $set: true
                }
            });
        }
    }

    submitClicked(data) {
        if (!this.state.captchaVerified) {
            this.updateState({
                signupErrorStyle: {
                    display: {
                        $set: "block"
                    },
                    value: {
                        $set: "You should verify you are not a robot."
                    }
                }
            });
        } else if (this.usernameText.value.length == 0 || this.firstNameText.value.length == 0 || this.lastNameText.value.length == 0 || this.emailText.value.length == 0 || this.passwordText.value.length == 0 || this.repeatPasswordText.value.length == 0) {
            this.updateState({
                signupErrorStyle: {
                    display: {
                        $set: "block"
                    },
                    value: {
                        $set: "You should fill all fields."
                    }
                }
            });
        } else if (this.passwordText.value != this.repeatPasswordText.value) {
            this.updateState({
                signupErrorStyle: {
                    display: {
                        $set: "block"
                    },
                    value: {
                        $set: "The passwords doesn't match."
                    }
                }
            });
        } else if (this.passwordText.value.length < 6) {
          this.updateState({
              signupErrorStyle: {
                  display: {
                      $set: "block"
                  },
                  value: {
                      $set: "The password length can't be less than 6."
                  }
              }
          });
        } else {
            this.updateState({
                signupErrorStyle: {
                    display: {
                        $set: "hidden"
                    },
                    value: {
                        $set: ""
                    }
                },
                submitProgress: {$set: true}
            });
            var t = this;
            GCPlotCore.register({
                username: t.usernameText.value,
                first_name: t.firstNameText.value,
                last_name: t.lastNameText.value,
                password: t.passwordText.value,
                email: t.emailText.value
            }, function() {
                location.reload();
            }, function(code, title, message) {
                t.updateState({
                    signupErrorStyle: {
                        display: {
                            $set: "block"
                        },
                        value: {
                            $set: title + " (" + message + ")"
                        }
                    },
                    submitProgress: {$set: false}
                });
            });
        }
    }

    onLogin() {
      if (this.liLoginText.value.length == 0 || this.liPasswordText.value.length == 0) {
        this.updateState({
            loginErrorStyle: {
                display: {
                    $set: "block"
                },
                value: {
                    $set: "You must fill both fields."
                }
            }
        });
      } else {
        this.updateState({
            loginErrorStyle: {
                display: {
                    $set: "none"
                },
                value: {
                    $set: ""
                }
            },
            loginProgress: {$set: true}
        });
        var t = this;
        GCPlotCore.login(this.liLoginText.value, this.liPasswordText.value, function() {
          location.reload();
        }, function(code, title, message) {
          t.updateState({
              loginErrorStyle: {
                  display: {
                      $set: "block"
                  },
                  value: {
                      $set: title + " (" + message + ")"
                  }
              },
              loginProgress: {$set: false}
          });
        });
      }
    }

    render() {
        return (
            <div className="container">
                <div className="row">
                    <div className="nine columns">
                        <section className="header">
                            <h1 className="title">
                                <b>GC</b>Plot
                            </h1>
                            <h2 className="title">
                                Universal JVM Garbage Collector Logs Analyser
                            </h2>
                            <h3>
                                Made by developers for the developers
                            </h3>
                            <div className="value-props row">
                                <div className="four columns value-prop">
                                    <img className="value-img" src="img/missile.png" width="100" height="200"/>
                                    Monitor how your Garbage Collector flies continuously - on the complex system or just a simple app.
                                </div>
                                <div className="four columns value-prop">
                                    <img className="value-img" src="img/reports.png" width="200" height="200"/>
                                    Decent amount of reports, charts and hints will help you to undertand all pitfalls in your GC configuration.
                                </div>
                                <div className="four columns value-prop">
                                    <img className="value-img" src="img/plug.png" width="200" height="200"/>
                                    Connect multiple JVMs in realtime or upload individual log files - all made as straightforward as possible.
                                </div>
                            </div>
                        </section>
                    </div>
                    <div className="three columns">
                        <section className="header">
                            <h2>Log In</h2>
                            <input className="u-full-width" type="email" placeholder="Username or email" ref={(r) => this.liLoginText = r}/>
                            <input className="u-full-width" type="password" placeholder="Password" ref={(r) => this.liPasswordText = r}/>
                            <p style={this.state.loginErrorStyle}>{this.state.loginErrorStyle.value}</p>
                            {(() => {
                                if (this.state.loginProgress) {
                                    return <Spinner spinnerName="three-bounce"/>
                                }
                            })()}
                            <input className="button-primary" type="submit" onClick={this.onLogin.bind(this)} value="Login"/>
                            <h2>Sign up</h2>
                            <input className="u-full-width" type="text" placeholder="Username" ref={(r) => this.usernameText = r}/>
                            <input className="u-full-width" type="text" placeholder="First Name" ref={(r) => this.firstNameText = r}/>
                            <input className="u-full-width" type="text" placeholder="Last Name" ref={(r) => this.lastNameText = r}/>
                            <input className="u-full-width" type="email" placeholder="Email" ref={(r) => this.emailText = r}/>
                            <input className="u-full-width" type="password" placeholder="Password" ref={(r) => this.passwordText = r}/>
                            <input className="u-full-width" type="password" placeholder="Repeat Password" ref={(r) => this.repeatPasswordText = r}/>
                            <Recaptcha sitekey="6LcxXwgUAAAAAO7z8CIDSZmWg0kTf7vgzB1eei1F" render="explicit" verifyCallback={this.verifyCallback} onloadCallback={this.onloadCallback}/>
                            <p style={this.state.signupErrorStyle}>{this.state.signupErrorStyle.value}</p>
                            {(() => {
                                if (this.state.submitProgress) {
                                    return <Spinner spinnerName="three-bounce"/>
                                }
                            })()}
                            <input className="button-primary" type="submit" onClick={this.submitClicked.bind(this)} value="Submit"/>
                        </section>
                    </div>
                </div>
            </div>
        );
    }
}

WelcomeLayout.defaultProps = {};

export default WelcomeLayout;