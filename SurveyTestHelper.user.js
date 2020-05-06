// ==UserScript==
// @name     Survey Test Helper
// @version  1.8
// @grant    none
// @include /^https?:\/\/.+\.com\/index\.php\/survey\/.*/
// @include /^https?:\/\/.+\.com\/index\.php\/[0-9]{6}.*/
// ==/UserScript==

// Question type-specific classes; in element div.question-container
const QUESTION_CLASSES = {
  "list-radio": 1,
  "numeric": 2,
  "text-short": 3,
  "array-flexible-row": 4,
  "multiple-opt": 5,
  "list-dropdown": 6,
  "numeric-multi": 7
};
const QUESTION_TYPE = {
  radio: 1,
  numericInput: 2,
  shortFreeText: 3,
  array: 4,
  mChoice: 5,
  dropdown: 6,
  multiNumInput: 7
};
const BUTTON_CODES = {
  right: 39,
  left: 37,
  up: 38,
  down: 40,
  spacebar: 32,
  enter: 13,
  esc: 27,
  insert: 45
};
const Q_CONTEXT = {
  age: 1,
  year: 2,
  zipCode: 3,
  quantity: 4,
  percent: 5,
  yearRef: 6,
  yearAL: 7
};
const COOKIE_ACTIVE_NAME = "STH_active";
const COOKIE_ATTEMPTS_NAME = "STH_attempts";

let curDate = new Date();
let validAgeYear = curDate.getFullYear() - 18;

let SurveyTestHelper = {
  active: false,
  attempts: 0,
  hidden: false,
  questionCode: null,
  questionType: null,
  errorDeactivateOverride: false,
  forceIndex: false,
  errorAlertShown: false,
  initialize: function () {
    console.log("Initializing...");
    this.addErrorAlertListener();
    this.questionCode = document.querySelector("span#QNameNumData");
    this.questionCode = this.questionCode ? this.questionCode.dataset.code : null;

    this.questionType = this.getQuestionType();
    this.initCookie();
    this.initUI();

    // Attach handlers
    this.button.onclick = this.buttonActionHandler.bind(this);
    document.onkeydown = this.buttonActionHandler.bind(this);

    document.body.appendChild(this.uiContainer);

    // Delay the auto-run so that LS has a chance to properly manage its UI before we start
    window.setTimeout(function () {
      if (this.active) {
        this.enterDummyResponse();
        this.clickNextButton();
      }
    }.bind(this), 10);
  },
  initUI: function () {
    this.uiContainer = document.createElement("div");
    this.infoDisplay = document.createElement("div");
    this.alertDisplay = document.createElement("div");
    this.activeCheckbox = document.createElement("input");
    this.button = document.createElement("button");
    this.excludeContainer = document.createElement("div");
    
    let chkBoxLabel = document.createElement("label");
    
    chkBoxLabel.innerHTML = "Auto Run Toggle:";
    chkBoxLabel.style["background-color"] = "rgba(255,255,255,0.7)";
    chkBoxLabel.style["border-radius"] = "5px";
    chkBoxLabel.style.padding = "0px 3px";
    chkBoxLabel.style.margin = "5px 0px";
    chkBoxLabel.style.cursor = "pointer";
    chkBoxLabel.style.display = "block";
    chkBoxLabel.appendChild(this.activeCheckbox);
    
   	this.uiContainer.style.position = "fixed";
    this.uiContainer.style.padding = "7px";
    this.uiContainer.style.right = "0px";
    this.uiContainer.style.top = "75px";
    this.uiContainer.style["transition-duration"] = "0.5s";
    this.uiContainer.style["margin-right"] = "15px";
    this.uiContainer.style["z-index"] = 2001;
    this.uiContainer.style["background-color"] = "rgba(0,0,0,0.1)";
    this.uiContainer.style["border-radius"] = "10px";
    this.uiContainer.style["text-align"] = "center";

    this.infoDisplay.innerHTML = this.questionCode;
    this.infoDisplay.style.height = "40px";
    this.infoDisplay.style.display = "inline-block";
    this.infoDisplay.style.color = "floralwhite";
    this.infoDisplay.style.padding = "10px";
    this.infoDisplay.style["background-color"] = "orange";
    this.infoDisplay.style["border-radius"] = "20px";
    this.infoDisplay.style["font-weight"] = "bold";

    this.alertDisplay.style["font-weight"] = "bold";
    this.alertDisplay.style["background-color"] = "rgba(255,255,255,0.5)";
    this.alertDisplay.style["transition-duration"] = "0.75s";
    this.alertDisplay.ontransitionend = function () {
      this.style.color = "#000000";
    };

    this.activeCheckbox.type = "checkbox";
    this.activeCheckbox.style["margin-left"] = "10px";
    this.activeCheckbox.checked = this.active;
    this.activeCheckbox.onclick = this.setActivity.bind(this);

    this.button.style.display = "block";
    this.button.style.width = "100%";
    this.button.innerHTML = "Input and Continue";
  
    this.uiContainer.appendChild(this.infoDisplay);
    this.uiContainer.appendChild(chkBoxLabel);
    this.uiContainer.appendChild(this.button);
    this.uiContainer.appendChild(this.alertDisplay);
  },
  initCookie: function () {
    let prevQuestion = sessionStorage.getItem("STH_qcode") || "Start";
    let activity = sessionStorage.getItem(COOKIE_ACTIVE_NAME);
    let attempts = sessionStorage.getItem(COOKIE_ATTEMPTS_NAME);

    sessionStorage.setItem("STH_qcode", this.questionCode);
    sessionStorage.setItem("STH_prev_qcode", prevQuestion);
    
    if (activity) {
      this.active = (activity === "1");
    } else {
      sessionStorage.setItem(COOKIE_ACTIVE_NAME, "0");
    }
    
    if (prevQuestion == this.questionCode) {
      this.attempts = Number(attempts);
    } else {
      sessionStorage.removeItem(COOKIE_ATTEMPTS_NAME);
    }
  },
  setAlert: function (alertText = "Generic Error Alert.") {
    this.alertDisplay.innerHTML = alertText;
    this.alertDisplay.style.padding = "5px";
    this.alertDisplay.style["margin-top"] = "5px";
    this.alertDisplay.style.border = "1px solid black";
    this.alertDisplay.style.color = "#FF0000";
  },
  clickNextButton: function () {
    let nextBtn = document.querySelector("#movenextbtn") || document.querySelector("#movesubmitbtn");
    
    if (nextBtn) {
      nextBtn.click();
    } else {
      if (this.active) {
        this.clickPrevButton();
      }
    }
  },
  clickPrevButton: function () {
    let prevBtn = document.querySelector("#moveprevbtn");
    if (prevBtn) {
      prevBtn.click();
    }
  },
  setActivity: function (e) {
    this.active = e.target ? e.target.checked : e;
    this.activeCheckbox.checked = this.active;
    console.log("Activity changed: ", this.active);

    this.setCookieActivity(this.active);
  },
  setCookieActivity: function (activity) {
    sessionStorage.setItem(COOKIE_ACTIVE_NAME, activity ? "1" : "0");
  },
  buttonActionHandler: function (e) {
    switch (e.type) {
      case "keydown":
        this.handleKeyDown(e.keyCode);
        break;
      case "click":
        this.enterDummyResponse();
        this.clickNextButton();
        break;
      default:
        console.log("buttonActionHandler: Did nothing.");
    }
  },
  handleKeyDown: function (keyCode) {
    if (this.hidden) {
      if (keyCode === BUTTON_CODES.esc) {
        this.toggleUI();
      }
    } else {
      switch (keyCode) {
        case BUTTON_CODES.right:
          this.enterDummyResponse();
          // Fallthrough
        case BUTTON_CODES.enter:
          this.clickNextButton();
          break;
        case BUTTON_CODES.left:
          this.clickPrevButton();
          break;
        case BUTTON_CODES.spacebar:
          this.setActivity(!this.active);
          break;
        case BUTTON_CODES.insert:
          this.enterDummyResponse();
          break;
        case BUTTON_CODES.esc:
          this.toggleUI();
          break;
      }
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
  getQuestionContext: function () {
    // Return a context enumeration based on what the question text contains
    let questionText = document.querySelector("div.question-text").innerText.toLowerCase();
    let context = null;

    if (questionText.includes("age") || questionText.includes("how old")) {
      context = Q_CONTEXT.age;
    }
    if (questionText.includes("postal ") || questionText.includes("zip ")) {
      context = Q_CONTEXT.zipCode;
    }
    if (questionText.includes(" many") 
      || questionText.includes(" much")
      || questionText.includes(" number")) {
      context = Q_CONTEXT.quantity;
    }
    if (questionText.includes("year") || questionText.includes(" born") ) {
      if (questionText.includes("9999")) {
        context = Q_CONTEXT.yearRef;
      } else if (questionText.includes("0000")) {
        context = Q_CONTEXT.yearAL;
      } else {
        context = Q_CONTEXT.year;
      }
    }
    return context;
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
        this.setAlert("Answer Invalid." + (this.active ? " Pausing run..." : ""));
        mutation.target.querySelector("div.modal-footer>a.btn.btn-default").click();
        if (!this.errorDeactivateOverride) {
          this.setActivity(false);
        }
      }
    });
  },
  enterDummyResponse: function () {

    switch (this.questionType) {
      case QUESTION_TYPE.radio:
        this.selectRandomRadio();
        break;
      case QUESTION_TYPE.numericInput:
        this.enterNumericValue();
        break;
      case QUESTION_TYPE.shortFreeText:
        this.enterSFTValue();
        break;
      case QUESTION_TYPE.array:
        this.selectArrayOptions();
        break;
      case QUESTION_TYPE.mChoice:
        this.selectMultipleChoiceOptions();
        break;
      case QUESTION_TYPE.dropdown:
        this.selectRandomDropdown();
        break;
      default:
        console.log("Handleable question type not found.");
    }
  },
  clearResponses: function () {
    switch (this.questionType) {
      case QUESTION_TYPE.radio:
        this.clearRadio();
        break;
      case QUESTION_TYPE.mChoice:
        this.clearMChoice();
        break;
    }
  },
  selectRandomRadio: function () {
    let ansList = document.querySelectorAll("div.answers-list>div.answer-item");
    let r = 0;
    let optionFound = false;

    this.clearRadio();

    // Select a random answer option until we get one that's not hidden
    do {
      r = roll(0, ansList.length);
      if (!(ansList.item(r).style.display === "none")) {
        ansList.item(r).querySelector("input.radio").checked = true;
        let otherOpt = ansList.item(r).querySelector("input.text");
        if (otherOpt) {
          let context = this.getQuestionContext();
          switch (context) {
            case Q_CONTEXT.age:
            case Q_CONTEXT.percent:
              otherOpt.value = roll(18, 100);
              break;
            case Q_CONTEXT.year:
              otherOpt.value = roll(1910, validAgeYear);
              break;
            case Q_CONTEXT.zipCode:
              otherOpt.value = "90210";
              break;
            case Q_CONTEXT.quantity:
              otherOpt.value = roll(0, 20);
              break;
            default:  // Generic string response
              otherOpt.value = "Run at: " + getDateString();
          }
        }
        optionFound = true;
      }
    } while (!optionFound);
  },
  clearRadio: function () {
    let ansList = document.querySelectorAll("div.answers-list>div.answer-item");
    let ans;
    for (let i = 0; i < ansList.length; i++) {
      ans = ansList.item(i).querySelector("input.radio");
      if (ans.checked) {
        ans.checked = false;
        let otherOpt = ansList.item(i).querySelector("input.text");
        if (otherOpt) {
          otherOpt.value = "";
        }
        break; 
      }
    }
  },
  enterNumericValue: function () {
    let inputVal = 0;
    let inputElement = document.querySelector("div.question-container input.numeric");
    let context = this.getQuestionContext();

    switch (context) {
      case Q_CONTEXT.age:
      case Q_CONTEXT.percent:
        inputVal = generateNumericInput(18, 100);
        break;
      case Q_CONTEXT.year:
        inputVal = generateNumericInput(1910, validAgeYear);
        break;
      case Q_CONTEXT.zipCode:
        inputVal = 90210;
        break;
      case Q_CONTEXT.yearRef:
        // Year except with a refused option
        inputVal = generateNumericInput(1910, validAgeYear, 9999);
        break;
      case Q_CONTEXT.yearAL:
        // Client-specific year w/ refused option
        inputVal = generateNumericInput(1910, validAgeYear, 0);
        break;
      default:  // Probably a quantity or something
        inputVal = roll(0, 20);
    }

    inputElement.value = inputVal;
  },
  enterSFTValue: function () {
    let inputElement = document.querySelector("div.question-container input.text");

    inputElement.value = "Run at: " + getDateString();
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
    let numToCheck = roll(1, Math.ceil(checkboxes.length / 2));
    let toBeChecked = [];
    let r = 0;

    // Clear the checkboxes before re-selecting them
    this.clearMChoice();

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
  },
  clearMChoice: function () {
    let checkboxes = document.querySelectorAll("div.questions-list div.answer-item input.checkbox");

    checkboxes.forEach(chkbox => {
      if (chkbox.checked) {
        chkbox.click();
      }
      if (chkbox.classList.contains("other-checkbox")) {
        chkbox.closest("div.answer-item").querySelector("input.text").value = "";
      }
    });
  },
  selectRandomDropdown: function () {
    let dropdownElement = document.querySelector("div.question-container select.list-question-select");
    let r = roll(0, dropdownElement.length - 1);
    let option = dropdownElement[r];

    while (!option.value) {
      r = roll(0, dropdownElement.length - 1);
      option = dropdownElement[r];
    }

    option.selected = true;
  },
  toggleUI: function () {
    if (this.hidden) {
      this.uiContainer.style["margin-right"] = "15px";
      this.hidden = false;
    } else {
      this.uiContainer.style["margin-right"] = "-" + (15 + this.uiContainer.offsetWidth) + "px";
      this.hidden = true;
    }
  }
};

function roll (min, max) {
  return (Math.random() * (max - min) + min) | 0;
};

function generateNumericInput (min, max, refusedVal=-1) {
  let returnVal = 0;
  // 20% chance of returning refused option, if provided
  if (refusedVal > -1) {
    returnVal = (roll(0, 100) < 20) ? refusedVal : roll(min, max);
  } else {
    returnVal = roll(min, max);
  }
  return returnVal;
};

function getDateString () {
  return String(curDate.getMonth() + 1).padStart(2, "0") + "-" + String(curDate.getDate()).padStart(2, "0") + " " + curDate.getHours() + ":" + curDate.getMinutes();
}

SurveyTestHelper.initialize();