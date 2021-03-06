/*jshint -W109 */

import $ from 'jquery';
import { useBasename } from 'history'
import { browserHistory } from 'react-router';
var jsonpipe = require('jsonpipe');

function GCPlotCore() {
}

GCPlotCore.ANONYMOUS_ANALYSE_ID = "7acada7b-e109-4d11-ac01-b3521d9d58c3";

GCPlotCore.TOKEN_KEY = "token";
GCPlotCore.USER_INFO = "user_info";
GCPlotCore.ANALYSES = "analyses";

GCPlotCore.APP_SUFFIX = "/app";

GCPlotCore.history = useBasename(() => browserHistory)({ basename: GCPlotCore.APP_SUFFIX })

GCPlotCore.INTERNAL_ERROR_HANDLER = function(status) {
  alert(status);
}

GCPlotCore.errorHandler = function(code, title, msg) {
  if (code != 292) {
    alert("(" + code + ") " + title + " | " + msg);
    GCPlotCore.removeToken();
  }
}

$(window).on('beforeunload', function() {
  sessionStorage.removeItem(GCPlotCore.USER_INFO);
  sessionStorage.removeItem(GCPlotCore.ANALYSES);
});

GCPlotCore.PROFILE_CHANGED_EVENT = "profile.changed.event";
GCPlotCore.ANALYSES_CHANGED_EVENT = "analyses.changed.event";

GCPlotCore.ACCOUNT_CONF_IDS = {
  PRELOAD_ANALYSIS_ON_PAGE_OPEN: "1",
  NOTIFICATIONS_ENABLED: "2",
  NOTIFY_REALTIME_AGENT_HEALTH: "3",
  REALTIME_AGENT_INACTIVE_SECONDS: "4"
};

GCPlotCore.ERRORS = {
  '1': 'Undefined error',
  '291': 'Not authorized',
  '292': 'Account not confirmed',
  '293': 'Request rejected by internal rules',
  '294': 'Wrong credentials',
  '500': 'Internal error',
  '295': 'Not unique fields',
  '296': 'User is blocked',
  '403': 'Access denied',
  '404': 'Not found',
  '405': 'Same passwords',
  '406': 'User already exists',
  '407': 'Resource wasn\'t found',
  '6485': 'Old Password mismatch with new one',
  '513': 'Unknown Analysis Group',
  '514': 'Unknown JVM Id',
  '769': 'Invalid request param',
  '516': 'Analysis Group - Logs Source Error'
};

GCPlotCore.PHASES = {
  0: 'Other',
  1: 'G1 Initial Mark',
  2: 'G1 Root Region Scanning',
  3: 'G1 Concurrent Marking',
  4: 'G1 Remark',
  5: 'G1 Cleanup',
  6: 'G1 Copying',
  7: 'CMS Initial Mark',
  8: 'CMS Concurrent Mark',
  9: 'CMS Concurrent Preclean',
  10: 'CMS Remark',
  11: 'CMS Concurrent Sweep',
  12: 'CMS Concurrent Reset'
};

GCPlotCore.CAUSES = {
  0: 'Other',
  1: 'System.gc()',
  2: 'Allocation Profiler',
  3: 'JvmtiEnv ForceGarbageCollection',
  4: 'GC Locker',
  5: 'Heap Inspection',
  6: 'Heap Dump',
  7: 'No GC',
  8: 'Allocation Failure',
  9: 'Perm Generation Full',
  10: 'Metadata GC Threshold',
  11: 'CMS Initial Mark',
  12: 'CMS Final Remark',
  13: 'Adaptive Size Ergonomics',
  14: 'G1 Evacuation Pause',
  15: 'G1 Humongous Allocation',
  16: 'Last Ditch Collection'
};

GCPlotCore.YOUNG_GEN = 1;
GCPlotCore.TENURED_GEN = 2;
GCPlotCore.PERM_GEN = 3;
GCPlotCore.METASPACE_GEN = 4;
GCPlotCore.OLD_GEN = 5;
GCPlotCore.OTHER_GEN = 6;
GCPlotCore.YOUNG_GEN_STR = '1';
GCPlotCore.TENURED_GEN_STR = '2';
GCPlotCore.PERM_GEN_STR = '3';
GCPlotCore.METASPACE_GEN_STR = '4';
GCPlotCore.OLD_GEN_STR = '5';
GCPlotCore.OTHER_GEN_STR = '6';

/**
 * Only the generations we really support so far.
**/
GCPlotCore.generationName = function(gen) {
  if (gen == GCPlotCore.YOUNG_GEN || gen == GCPlotCore.YOUNG_GEN_STR) {
    return 'Young';
  }
  if (gen == GCPlotCore.TENURED_GEN || gen == GCPlotCore.TENURED_GEN_STR) {
    return 'Tenured';
  }
  if (gen == GCPlotCore.PERM_GEN || gen == GCPlotCore.PERM_GEN_STR) {
    return 'Perm';
  }
  if (gen == GCPlotCore.METASPACE_GEN || gen == GCPlotCore.METASPACE_GEN_STR) {
    return 'Metaspace';
  }
  return null;
}

GCPlotCore.on = function(event, handler) {
  $(document).on(event, handler);
}

GCPlotCore.off = function(event, handler) {
  $(document).off(event, handler);
}

GCPlotCore.trigger = function(event) {
  $(document).trigger(event);
}

GCPlotCore.currentProtocol = function() {
  return 'http' + (document.location.protocol === 'https:' ? 's://' : '://');
};

GCPlotCore.apiUrl = function() {
  return GCPlotCore.currentProtocol() + window.gcplotHost + (window.gcplotPort == null ? "" : ":" + window.gcplotPort) + "/rest"
};

GCPlotCore.getToken = function() {
  return localStorage.getItem(GCPlotCore.TOKEN_KEY);
}

GCPlotCore.setToken = function(token) {
  localStorage.setItem(GCPlotCore.TOKEN_KEY, token);
}

GCPlotCore.removeToken = function() {
  localStorage.removeItem(GCPlotCore.TOKEN_KEY);
}

GCPlotCore.changeUsername = function(newUsername, callback, errorCallback) {
  var msg = { new_username: newUsername };
  $.ajax({
    type: 'POST',
    url: GCPlotCore.authUrl("/user/change_username"),
    contentType: "application/json",
    data: JSON.stringify(msg),
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.USER_INFO);
        GCPlotCore.trigger(GCPlotCore.PROFILE_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.changePassword = function(oldPass, newPass, callback, errorCallback) {
  var msg = { old_password: oldPass, new_password: newPass };
  $.ajax({
    type: 'POST',
    url: GCPlotCore.authUrl("/user/change_password"),
    contentType: "application/json",
    data: JSON.stringify(msg),
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        callback();
      }
    }
  });
}

GCPlotCore.userInfo = function(callback) {
  var userInfoJson = sessionStorage.getItem(GCPlotCore.USER_INFO);
  if ((typeof userInfoJson != "undefined") && userInfoJson != null) {
    return callback(JSON.parse(userInfoJson));
  } else {
    $.get(GCPlotCore.authUrl("/user/info"), GCPlotCore.dataHandler(function(data) {
      var r = JSON.parse(data);
      if (!r.hasOwnProperty('error')) {
        sessionStorage.setItem(GCPlotCore.USER_INFO, JSON.stringify(r.result));
        callback(r.result);
      }
    }));
  }
}

GCPlotCore.login = function(username, password, callback, errorCallback) {
  $.get(GCPlotCore.url("/user/login?login=" + encodeURIComponent(username) + "&password=" + encodeURIComponent(password)),
      GCPlotCore.dataHandler(function(data) {
        var r = JSON.parse(data);
        if (r.hasOwnProperty('error')) {
          errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
        } else {
          var res = r.result;
          GCPlotCore.setToken(res.token);
          sessionStorage.setItem(GCPlotCore.USER_INFO, JSON.stringify(r.result));
          callback();
        }
      }));
};

GCPlotCore.sendConfirmation = function(callback, errorCallback) {
  $.get(GCPlotCore.authUrl("/user/send/confirmation"),
      GCPlotCore.dataHandler(function(data) {
        var r = JSON.parse(data);
        if (r.hasOwnProperty('error')) {
          errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
        } else {
          callback();
        }
      }));
}

/*
* userData -> {
*   username, first_name, last_name, password, email
* }
*/
GCPlotCore.register = function(userData, callback, errorCallback) {
  $.ajax({
    type: "POST",
    url: GCPlotCore.url("/user/register"),
    data: JSON.stringify(userData),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        GCPlotCore.login(userData.username, userData.password, function() {
          callback();
        }, function(code, title, msg) {
          errorCallback(code, title, msg);
        });
      }
    }
  });
}

GCPlotCore.logoff = function() {
  localStorage.removeItem(GCPlotCore.TOKEN_KEY);
  sessionStorage.removeItem(GCPlotCore.USER_INFO);
  sessionStorage.removeItem(GCPlotCore.ANALYSES);
}

GCPlotCore.analyses = function(callback, errorCallback) {
  var analysesJson = sessionStorage.getItem(GCPlotCore.ANALYSES);
  if ((typeof analysesJson != "undefined") && analysesJson != null) {
    return callback(JSON.parse(analysesJson));
  } else {
    $.get(GCPlotCore.authUrl("/analyse/all"), GCPlotCore.dataHandler(function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        try {
          for (var i = 0; i < r.result.analyses.length; i++) {
            var jvms = r.result.analyses[i].jvm_ids || [];
            var namesByJvm = r.result.analyses[i].jvm_names || {};

            var jvmByName = {};
            var namesArr = [];
            var sortedJvms = [];
            for (var j = 0; j < jvms.length; j++) {
              var name = namesByJvm[jvms[j]] || jvms[j];
              name += jvms[j];
              jvmByName[name] = jvms[j];
              namesArr.push(name);
            }
            namesArr.sort();
            for (var j = 0; j < namesArr.length; j++) {
              sortedJvms.push(jvmByName[namesArr[j]]);
            }
            r.result.analyses[i].jvm_ids = sortedJvms;
          }
        } catch(ex) {
        }
        sessionStorage.setItem(GCPlotCore.ANALYSES, JSON.stringify(r.result));
        callback(r.result);
      }
    }));
  }
}

GCPlotCore.getAnalysis = function(id, callback, errorCallback) {
  $.get(GCPlotCore.authUrl("/analyse/get?id=" + id), GCPlotCore.dataHandler(function(data) {
    var r = JSON.parse(data);
    if (r.hasOwnProperty('error')) {
      errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
    } else {
      callback(r.result);
    }
  }));
}

GCPlotCore.changePasswordMail = function(email, callback, errorCallback) {
  var msg = { email: email };
  $.ajax({
    type: "POST",
    url: GCPlotCore.url("/user/send/new_password"),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        callback();
      }
    }
  });
}

GCPlotCore.newPassword = function(token, salt, newPass, callback, errorCallback) {
  var msg = { salt: salt, new_password: newPass };
  $.ajax({
    type: "POST",
    url: GCPlotCore.url("/user/change_password?token=" + token),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        callback();
      }
    }
  });
}

GCPlotCore.updateAccountConfig = function(id, value) {
  var msg = { prop_id: id, value: value + "" };
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/user/config/update"),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (!r.hasOwnProperty('error')) {
        sessionStorage.removeItem(GCPlotCore.USER_INFO);
        GCPlotCore.trigger(GCPlotCore.PROFILE_CHANGED_EVENT);
      }
    }
  });
}

GCPlotCore.updateAnalyseBulk = function(msg, callback, errorCallback) {
  GCPlotCore.updateAnalyse(msg, callback, errorCallback, "/analyse/jvm/update/bulk");
}

GCPlotCore.updateAnalyse = function(msg, callback, errorCallback, url) {
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl(url || "/analyse/update"),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.addAnalyse = function(req, callback, errorCallback) {
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/analyse/new"),
    data: JSON.stringify(req),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.updateAnalyzeSource = function(req, callback, errorCallback) {
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/analyse/update/source"),
    data: JSON.stringify(req),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.updateAnalyzeConfig = function(analyseId, req, callback, errorCallback) {
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/analyse/update/config?analyse_id=" + analyseId),
    data: JSON.stringify(req),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.deleteAnalyse = function(id, callback, errorCallback) {
  $.ajax({
    type: "DELETE",
    url: GCPlotCore.authUrl("/analyse/delete?id=" + id),
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.deleteJvm = function(analyseId, jvmId, callback, errorCallback) {
  $.ajax({
    type: "DELETE",
    url: GCPlotCore.authUrl("/analyse/jvm/delete?analyse_id=" + analyseId + "&jvm_id=" + jvmId),
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else {
        sessionStorage.removeItem(GCPlotCore.ANALYSES);
        GCPlotCore.trigger(GCPlotCore.ANALYSES_CHANGED_EVENT);
        callback();
      }
    }
  });
}

GCPlotCore.lazyGCEvents = function(data, callback, errorCallback, completeCallback) {
  jsonpipe.flow(GCPlotCore.authUrl("/gc/jvm/events/full/sample/stream") + "&" +
    "analyse_id" + "=" + data.analyse_id + "&" + "jvm_id" + "=" + encodeURIComponent(data.jvm_id) +
     "&" + "tz" + "=" + encodeURIComponent(data.tz || "") + "&" + "from" + "=" + data.from + "&" + "to" + "=" + data.to +
     "&delimit=true&stats=true", {
        "delimiter": "$d",
        "success": function(d) {
          callback(d, data);
        },
        "error": function(errorMsg) {
          console.error(errorMsg);
          errorCallback(errorMsg, data);
        },
        "complete": function(statusText) {
          if (completeCallback) {
            completeCallback(statusText, data);
          }
        },
        timeout: 180000,
        "method": "GET",
        "withCredentials": false
    });
}

GCPlotCore.objectsAges = function(analyseId, jvmId, callback, errorCallback) {
  $.ajax({
    type: "GET",
    url: GCPlotCore.authUrl("/jvm/gc/ages/last?analyse_id=" + analyseId + "&jvm_id=" + jvmId),
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else if (!$.isEmptyObject(r)) {
        callback(r.result, jvmId);
      }
    }
  });
}

GCPlotCore.changeEmail = function(newEmail, callback, errorCallback) {
  var msg = {
    new_email: newEmail
  };
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/user/change_email"),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else if (!$.isEmptyObject(r)) {
        callback();
        sessionStorage.removeItem(GCPlotCore.USER_INFO);
        GCPlotCore.trigger(GCPlotCore.PROFILE_CHANGED_EVENT);
      }
    }
  });
}

GCPlotCore.changeNotificationEmail = function(newEmail, callback, errorCallback) {
  var msg = {
    new_email: newEmail
  };
  $.ajax({
    type: "POST",
    url: GCPlotCore.authUrl("/user/change_notification_email"),
    data: JSON.stringify(msg),
    contentType: "application/json",
    success: function(data) {
      var r = JSON.parse(data);
      if (r.hasOwnProperty('error')) {
        errorCallback(r.error, GCPlotCore.ERRORS[r.error], r.message);
      } else if (!$.isEmptyObject(r)) {
        callback();
        sessionStorage.removeItem(GCPlotCore.USER_INFO);
        GCPlotCore.trigger(GCPlotCore.PROFILE_CHANGED_EVENT);
      }
    }
  });
}

GCPlotCore.createArray = function(len, itm) {
    var arr1 = [itm],
        arr2 = [];
    while (len > 0) {
        if (len & 1) arr2 = arr2.concat(arr1);
        arr1 = arr1.concat(arr1);
        len >>>= 1;
    }
    return arr2;
}

GCPlotCore.humanFileSize = function(bytes) {
    var thresh = 1024;
    if(Math.abs(bytes) < thresh) {
        return bytes + ' B';
    }
    var units = ['kB','MB','GB','TB','PB','EB','ZB','YB'];
    var u = -1;
    do {
        bytes /= thresh;
        ++u;
    } while(Math.abs(bytes) >= thresh && u < units.length - 1);
    return bytes.toFixed(3)+' '+units[u];
}

GCPlotCore.convertPause = function(pause) {
    if (pause < 1000000) {
      return (pause / 1000).toFixed(3) + " ms";
    } else {
      return (pause / 1000000).toFixed(3) + " secs";
    }
}

GCPlotCore.url = function(path) {
  return GCPlotCore.apiUrl() + path;
}

GCPlotCore.authUrl = function(path) {
  var url = GCPlotCore.url(path);
  if (path.indexOf('?') > 0) {
    url += '&token=' + GCPlotCore.getToken();
  } else {
    url += '?token=' + GCPlotCore.getToken();
  }
  return url;
}

GCPlotCore.dataHandler = function(dataHandler) {
  return function(data, status) {
    if (status != 'success') {
      GCPlotCore.INTERNAL_ERROR_HANDLER(status);
    } else {
      dataHandler(data);
    }
  };
}

GCPlotCore.isLoggedIn = function() {
  var token = GCPlotCore.getToken();
  return (typeof token != "undefined") && token != null;
};

GCPlotCore.rstr = function(length) {
  var chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
  return result;
}

GCPlotCore.defaultProps = {
};

export default GCPlotCore;
