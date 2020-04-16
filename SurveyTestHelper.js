// ==UserScript==
// @name     Survey Test Helper
// @version  1
// @grant    none
// @include /^https?:\/\/.+\.com\/index\.php\/survey\/.*/
// @include /^https?:\/\/.+\.com\/index\.php\/[0-9]{6}.*/
// @require https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js
// ==/UserScript==
const QUESTION_CLASSES = {
  "list-radio": 1,
  "numeric": 2,
  "text-short": 3,
  "array-flexible-row": 4
};
const QUESTION_TYPE = {
  radio: 1,
  numericInput: 2,
  shortFreeText: 3,
  array: 4
};
const COOKIE_NAME = "STH_active";

let STH_Cookies = function () {
  InternalCookies = Cookies.noConflict();
  return {
    get: function(name) {
      return InternalCookies.get(name);
    },
    set: function(name, value, attributes) {
      InternalCookies.set(name, value, attributes);
    },
    remove: function(name, attributes) {
      InternalCookies.remove(name, attributes);
    }
  };
}();

function roll (low, high) {
  return (Math.random() * (high - low) + low) | 0;
};

let SurveyTestHelper = {
  active: false,
  forceIndex: false,
  errorAlertShown: false,
  uiContainer: undefined,
  initialize: function () {
    console.log("Initializing...");
    this.addErrorAlertListener();
    
    this.initCookie();
    this.initUI();
    
    document.body.appendChild(this.uiContainer);

    if (this.active) {
      this.inputDummyResponse();
      this.clickNextButton();
    } else {
      this.getFocus();
    }
  },
  initUI: function () {
    let chkBoxActive = document.createElement("input");
    chkBoxActive.type = "checkbox";
    chkBoxActive.style["margin-left"] = "10px";
    chkBoxActive.checked = this.active;
    chkBoxActive.onclick = this.updateActivity.bind(this);
    
    let chkBoxLabel = document.createElement("label");
    chkBoxLabel.innerHTML = "Auto Run Toggle:";
    chkBoxLabel.appendChild(chkBoxActive);

    this.uiContainer = document.createElement("DIV");
    this.alertDisplay = document.createElement("DIV");
    this.button = document.createElement("BUTTON");
    
   	this.uiContainer.style.position = "fixed";
    this.uiContainer.style.padding = "12px";
    this.uiContainer.style.right = "25px";
    this.uiContainer.style.top = "75px";
    this.uiContainer.style["z-index"] = 2001;
    this.uiContainer.style["background-color"] = "rgba(0,0,0,0.1)";
    this.uiContainer.style["border-radius"] = "10px";

    this.alertDisplay.style["font-weight"] = "bold";
    this.alertDisplay.style["border"] = "1px solid black";
    this.alertDisplay.style["padding"] = "5px";
    this.alertDisplay.style["transition-duration"] = "0.75s";
    this.alertDisplay.innerHTML = "Alerts go here.";
    this.alertDisplay.ontransitionend = function () {
      this.alertDisplay.style.color = "#000000";
    }.bind(this);

    this.button.style.display = "block";
    this.button.style.width = "100%";
    this.button.innerHTML = "Do Stuff";
    this.button.onclick = this.button.onkeydown = this.buttonActionHandler.bind(this);
  
    this.uiContainer.appendChild(this.alertDisplay);
    this.uiContainer.appendChild(chkBoxLabel);
    this.uiContainer.appendChild(this.button);
  },
  initCookie: function () {
    let activity = STH_Cookies.get(COOKIE_NAME);
    if (activity) {
      this.active = (activity === "1");
    } else {
      STH_Cookies.set(COOKIE_NAME, "0");
    }
  },
  getFocus: function () {
    // Put the focus on the button so we can start catching inputs
    console.log("Focusing...");
    this.button.focus();
  },
  setAlert: function (alertText = "Generic Error Alert.") {
    this.alertDisplay.innerHTML = alertText;
    this.alertDisplay.style.color = "#FF0000";
  },
  clickNextButton: function () {
    let nextBtn = document.querySelector("#movenextbtn") || document.querySelector("#movesubmitbtn");
    nextBtn.click();
  },
  updateActivity: function (e) {
    this.active = e.target.checked;
    console.log("Activity changed: ", this.active);

    this.updateCookieActivity(this.active);
  },
  updateCookieActivity: function (activity) {
    STH_Cookies.set(COOKIE_NAME, activity ? "1" : "0");
  },
  buttonActionHandler: function (e) {
    console.log(e);
    this.inputDummyResponse();
    this.clickNextButton();
  },
  getQuestionType: function () {
    let containerClasses = document.querySelector("form#limesurvey div.question-container").classList;
    for (const typeName in QUESTION_CLASSES) {
      if (containerClasses.contains(typeName)) {
        return QUESTION_CLASSES[typeName];
      }
    }
    return false;
  },
  addErrorAlertListener: function () {
    const alertElement = document.querySelector("#bootstrap-alert-box-modal");
    const config = {
      attributes: true
    };
    let observer = new MutationObserver(this.alertFoundHandler.bind(this));
    observer.observe(alertElement, config);
  },
  alertFoundHandler: function (mutationList, observer) {
    mutationList.forEach(mutation => {
      if (mutation.attributeName === "style" && mutation.target.style.display !== "none") {
        this.setAlert("Answer Invalid. Pausing run...");
        mutation.target.querySelector("div.modal-footer>a.btn.btn-default").click();
        this.updateActivity({target:{checked:false}});
      }
    });
  },
  inputDummyResponse: function () {
    let qType = this.getQuestionType();

    switch (qType) {
      case QUESTION_TYPE.radio:
        console.log("Radio found.");
        this.selectRandomRadio();
        break;
      case QUESTION_TYPE.numericInput:
        console.log("Numeric Input found.");

        break;
      case QUESTION_TYPE.shortFreeText:
        console.log("Short Free Text found.");

        break;
      case QUESTION_TYPE.array:
        console.log("Array found.");

        break;
      default:
        console.log("Handleable question type not found.");
    }
  },
  selectRandomRadio: function () {
    let ansList = document.querySelector(".answers-list");
    let ans = ansList.getElementsByClassName("answer-item");
    let r = 0;
    // Select a random answer option until we get one that's not hidden
    do {
      r = roll(0, ans.length);
      ans.item(r).querySelector("input.radio").checked = true;
    } while (ans.item(r).style.display === "none");
  }
};

SurveyTestHelper.initialize();