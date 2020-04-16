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

let SurveyTestHelper = {
  active: false,
  forceIndex: false,
  errorAlertShown: false,
  uiContainer: undefined,
  initialize: function () {
  	// GET ON IT
    console.log("Initializing...");
    this.addErrorAlertListener();
    
    this.initUI();
    this.initCookie();
    
    document.body.appendChild(this.uiContainer);

    this.getFocus();
  },
  initUI: function () {

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

    this.button.style.display = "block";
    this.button.style.width = "100%";
    this.button.innerHTML = "Do Stuff";
    this.button.onclick = this.button.onkeydown = this.handleAction.bind(this);
  
    this.setAlert();
    this.uiContainer.appendChild(this.alertDisplay);
    this.uiContainer.appendChild(this.button);
  },
  start: function () {
    // THIS TOO
    console.log("Starting...");
  },
  initCookie: function () {

  },
  getFocus: function () {
    // Put the focus on the button so we can start catching inputs
    console.log("Focusing...");
    this.button.focus();
  },
  setAlert: function (alertText = "Alerts go here.") {
    this.alertDisplay.innerHTML = alertText;
  },
  clickNextButton: function () {
    let nextBtn = document.querySelector("#movenextbtn") || document.querySelector("#movesubmitbtn");
    nextBtn.click();
  },
  handleAction: function (e) {
    let qType = this.getQuestionType();

    switch (qType) {
      case QUESTION_TYPE.radio:
        console.log("Radio found.");

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
      }
    });
  },
  selectRandomRadio: function () {

  }
};

SurveyTestHelper.initialize();