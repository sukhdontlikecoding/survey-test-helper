// ==UserScript==
// @name     Survey Test Helper
// @version  1
// @grant    none
// @include /^https?:\/\/.+\.com\/index\.php\/survey\/.*/
// @include /^https?:\/\/.+\.com\/index\.php\/[0-9]{6}.*/
// @require https://cdn.jsdelivr.net/npm/js-cookie@rc/dist/js.cookie.min.js
// ==/UserScript==

// Question type-specific classes; in element div.question-container
const QUESTION_CLASSES = {
  "list-radio": 1,
  "numeric": 2,
  "text-short": 3,
  "array-flexible-row": 4,
  "multiple-opt": 5
};
const QUESTION_TYPE = {
  radio: 1,
  numericInput: 2,
  shortFreeText: 3,
  array: 4,
  mChoice: 5
};
const BUTTON_CODES = {
  right: 39,
  left: 37,
  up: 38,
  down: 40,
  spacebar: 32
};
const COOKIE_ACTIVE_NAME = "STH_active";
const COOKIE_ATTEMPTS_NAME = "STH_attempts";

// js-cookie noConflict example
// https://github.com/js-cookie/js-cookie/wiki/Design-Patterns-To-Use-With-JavaScript-Cookie
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
  attempts: 0,
  questionCode: null,
  errorDeactivateOverride: false,
  forceIndex: false,
  errorAlertShown: false,
  initialize: function () {
    console.log("Initializing...");
    this.addErrorAlertListener();
    this.questionCode = document.querySelector("span#QNameNumData");
    this.questionCode = this.questionCode ? this.questionCode.dataset.code : null;
    
    this.initCookie();
    this.initUI();

    // Attach handlers
    this.button.onclick = this.buttonActionHandler.bind(this);
    document.onkeydown = this.buttonActionHandler.bind(this);

    document.body.appendChild(this.uiContainer);

    // Delay the auto-run so that LS has a chance to properly manage its UI before we start
    window.setTimeout(function () {
      if (this.active) {
        this.inputDummyResponse();
        this.clickNextButton();
      }
    }.bind(this), 10);
  },
  initUI: function () {
    this.activeCheckbox = document.createElement("input");
    this.activeCheckbox.type = "checkbox";
    this.activeCheckbox.style["margin-left"] = "10px";
    this.activeCheckbox.checked = this.active;
    this.activeCheckbox.onclick = this.setActivity.bind(this);
    
    let chkBoxLabel = document.createElement("label");
    chkBoxLabel.innerHTML = "Auto Run Toggle:";
    chkBoxLabel.appendChild(this.activeCheckbox);

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
  
    this.uiContainer.appendChild(this.alertDisplay);
    this.uiContainer.appendChild(chkBoxLabel);
    this.uiContainer.appendChild(this.button);
  },
  initCookie: function () {
    let prevQuestion = STH_Cookies.get("STH_qcode") || "begin";
    let activity = STH_Cookies.get(COOKIE_ACTIVE_NAME);
    let attempts = STH_Cookies.get(COOKIE_ATTEMPTS_NAME);

    STH_Cookies.set("STH_qcode", this.questionCode);
    STH_Cookies.set("STH_prev_qcode", prevQuestion);
    
    if (activity) {
      this.active = (activity === "1");
    } else {
      STH_Cookies.set(COOKIE_ACTIVE_NAME, "0");
    }
    
    if (prevQuestion == this.questionCode) {
      this.attempts = Number(attempts);
    } else {
      STH_Cookies.remove(COOKIE_ATTEMPTS_NAME);
    }
  },
  setAlert: function (alertText = "Generic Error Alert.") {
    this.alertDisplay.innerHTML = alertText;
    this.alertDisplay.style.color = "#FF0000";
  },
  clickNextButton: function () {
    let nextBtn = document.querySelector("#movenextbtn") || document.querySelector("#movesubmitbtn");
    nextBtn.click();
  },
  clickPrevButton: function () {
    let prevBtn = document.querySelector("#moveprevbtn");
    prevBtn.click();
  },
  setActivity: function (e) {
    this.active = e.target ? e.target.checked : e;
    this.activeCheckbox.checked = this.active;
    console.log("Activity changed: ", this.active);

    this.setCookieActivity(this.active);
  },
  setCookieActivity: function (activity) {
    STH_Cookies.set(COOKIE_ACTIVE_NAME, activity ? "1" : "0");
  },
  buttonActionHandler: function (e) {
    switch (e.type) {
      case "keydown":
        this.handleKeyDown(e.keyCode);
        break;
      case "click":
        this.inputDummyResponse();
        this.clickNextButton();
        break;
      default:
        console.log("buttonActionHandler: Did nothing.");
    }
  },
  handleKeyDown: function (keyCode) {
    switch (keyCode) {
      case BUTTON_CODES.right:
        this.inputDummyResponse();
        this.clickNextButton();
        break;
      case BUTTON_CODES.left:
        this.clickPrevButton();
        break;
      case BUTTON_CODES.spacebar:
        this.setActivity(!this.active);
        break;
    }
  },
  getQuestionType: function () {
    let containerClasses = document.querySelector("form#limesurvey div.question-container");
    if (containerClasses) {
      containerClasses = containerClasses.classList;

      for (const typeName in QUESTION_CLASSES) {
        if (containerClasses.contains(typeName)) {
          return QUESTION_CLASSES[typeName];
        }
      }
    }
    return undefined;
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
        if (!this.errorDeactivateOverride) {
          this.setActivity(false);
        }
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
        this.enterNumericValue();
        break;
      case QUESTION_TYPE.shortFreeText:
        console.log("Short Free Text found.");
        this.enterSFTValue();
        break;
      case QUESTION_TYPE.array:
        console.log("Array found.");
        this.selectArrayOptions();
        break;
      case QUESTION_TYPE.mChoice:
        console.log("Multiple Choice found.");
        this.selectMultipleChoiceOptions();
        break;
      default:
        console.log("Handleable question type not found.");
    }
  },
  selectRandomRadio: function () {
    let radioAttempts = this.attempts;
    let ansList = document.querySelector(".answers-list");
    let ans = ansList.getElementsByClassName("answer-item");
    let r = 0;
    // Select a random answer option until we get one that's not hidden
    do {
      r = roll(0, ans.length);
      this.errorDeactivateOverride = false;
      ans.item(r).querySelector("input.radio").checked = true;
      if (ans.item(r).querySelector("input.text")) {
        // Other option text input
        switch (radioAttempts) {
          case 0:
            // DD Text
            ans.item(r).querySelector("input.text").value = "Dummy Data";
            STH_Cookies.set(COOKIE_ATTEMPTS_NAME, radioAttempts + 1);
            this.errorDeactivateOverride = true;
            break;
          case 1:
            // Generic age range
            ans.item(r).querySelector("input.text").value = roll(18, 99);
            STH_Cookies.set(COOKIE_ATTEMPTS_NAME, radioAttempts + 1);
            this.errorDeactivateOverride = true;
            break;
          default:
            // Generic year range
            ans.item(r).querySelector("input.text").value = roll(1910, 2001);
        }
      }
    } while (ans.item(r).style.display === "none");
  },
  enterNumericValue: function () {
    let numericAttempts = this.attempts;
    let inputVal = 0;
    let inputElement = document.querySelector(".question-container input.numeric");
    // 15% chance of returning refused option, if provided
    let generateNumericInput = function (min, max, refusedVal=undefined) {
      let returnVal = 0;
      if (refusedVal === undefined) {
        returnVal = (roll(0, 100) < 15) ? refusedVal : roll(min, max);
      } else {
        returnVal = roll(min, max);
      }
      return returnVal;
    };

    // If the input element is empty, we've reached a new question and the attempts cookie should be removed
    if (!inputElement.value) {
      STH_Cookies.remove(COOKIE_ATTEMPTS_NAME);
      numericAttempts = 1;
    }

    switch (numericAttempts) {
      case 0:
        // Generic Age Year
        inputVal = generateNumericInput(1910, 2001, 9999);
        STH_Cookies.set(COOKIE_ATTEMPTS_NAME, numericAttempts + 1);
        this.errorDeactivateOverride = true;
        break;
      case 1:
        // AL Age Year
        inputVal = generateNumericInput(1910, 2001, 0);
        STH_Cookies.set(COOKIE_ATTEMPTS_NAME, numericAttempts + 1);
        this.errorDeactivateOverride = true;
        break;
      case 2:
        // Raw Age/ percentage?
        inputVal = generateNumericInput(18, 100);
        STH_Cookies.set(COOKIE_ATTEMPTS_NAME, numericAttempts + 1);
        this.errorDeactivateOverride = true;
        break;
      default:
        // Generic valid Zip
        inputVal = 90210;
        STH_Cookies.remove(COOKIE_ATTEMPTS_NAME);
    }

    inputElement.value = inputVal;
  },
  enterSFTValue: function () {
    let inputElement = document.querySelector(".question-container input.text");
    let curDate = new Date();

    inputElement.value = "DD at: " + (curDate.getMonth() + 1) + "-" + curDate.getDate() + " " + curDate.getHours() + ":" + curDate.getMinutes();
  },
  selectArrayOptions: function () {
    let arrayTable = document.querySelector("table.questions-list");
    let rows = arrayTable.querySelectorAll(".answers-list");
    let options, r;
    rows.forEach(row => {
      options = row.querySelectorAll("td>input.radio");
      r = roll(0, options.length);
      options[r].checked = true;
    });
  },
  selectMultipleChoiceOptions: function () {
    let checkboxes = document.querySelectorAll("div.questions-list div.answer-item input.checkbox");
    let numToCheck = roll(1, checkboxes.length);
    let toBeChecked = [];
    let r = 0;

    // Clear the checkboxes before re-selecting them
    checkboxes.forEach(chkbox => {
      //chkbox.checked = false;
      if (chkbox.checked) {
        chkbox.click();
      }
      if (chkbox.classList.contains("other-checkbox")) {
        chkbox.closest("div.answer-item").querySelector("input.text").value = "";
      }
    });

    while (toBeChecked.length < numToCheck) {
      r = roll(0, checkboxes.length);
      if (!checkboxes[r].checked && checkboxes[r].closest("div.answer-item").style.display != "none") {
        checkboxes[r].checked = true;
        if (checkboxes[r].classList.contains("other-checkbox")) {
          checkboxes[r].closest("div.answer-item").querySelector("input.text").value = "Dummy Data";
        }
        toBeChecked.push(r);
      }
    }
  }
};

SurveyTestHelper.initialize();