//=========================================================================================================
//                                          Tiney 
// The ‘register’ feature, where providers can record the times that children attend their nursery each day. 
// 
//=========================================================================================================

// All children records are stored in the local storage. 
// All registered child informations are stored as a static data and expected childrens 
// for the particular day are stored as dynamic data.

// Static object to holds information about the registered child
const registerChildObj_G = {

    childDetails: {
        id:"",
        name: "",
        days:"",
    },

    setChild: function (id, name, days) {
        this.childDetails.id = id;
        this.childDetails.name = name;
        this.childDetails.days = days;
    }, 

    getChild: function(){
        return this.childDetails;
    }, 

    displayChild: function() {
        console.log(this.childDetails.id);
        console.log(this.childDetails.name);
        console.log(this.childDetails.days);
    }, 
};

// Dynamic data object
const childLogObj_G = [];

const childLogInfo = {
    id:"",
    name:"",
    date:"",
    inTime:"",
    outTime:"",
    absent: "false",
};


// Days lookup table
const daysLUT = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday'
};


//=========================================================================================================
// Initialization
// Setting up a load handler to do the main startup work once the page is fully loaded.
//
//=========================================================================================================

window.addEventListener("load", startup, false);

function startup() {

    // Registration Modal
    document.querySelector("#registerBtn").addEventListener("click",openRegisterForm); 
    document.querySelector("#modalRegisterClose").addEventListener("click", closeRegisterModal);
    document.querySelector("#registerForm").addEventListener("submit", registerChild);

    // SignIn/SignOut Modal
    document.querySelector("#modalSignInClose").addEventListener("click", closeSignInModal);
    window.addEventListener("click", handleClick);
    document.querySelector("#signInForm").addEventListener("submit", processSignIn);
    document.querySelector("#signOutForm").addEventListener("submit", processSignOut);
    document.querySelector("#signInAbsentBtn").addEventListener("click",reportAbsent);
    
    // Daily Log
    document.querySelector("#dailyLogBtn").addEventListener("click",getDailyLog);
    
    // History
    document.querySelector("#historyBtn").addEventListener("click",dispHistory);
    document.querySelector("#historyForm").addEventListener("submit",getHistory);
        
}


//=========================================================================================================
// registerChild
// Get the details from the register form and update the inforamtion in the local storage.
// Each child is given an unique Id. It is stored as a static data in the local storage.
//
//=========================================================================================================
function registerChild(event){
    
    event.preventDefault();

    // Get the form value
    let name = document.querySelector("#childName").value;
    let checkboxes = document.querySelectorAll('input[name="weekdays"]:checked');

    let checkedArr = [];

    checkboxes.forEach((checkbox) => {
        checkedArr.push(checkbox.id);
    });

    // Get the childId   
    let lastChildId = localStorage.getItem("lastChildId");
    let currentId = parseInt((lastChildId === null) ? 0 : lastChildId) + 1;

    // Update it in the local storage
    const registerChild = Object.create(registerChildObj_G);
    registerChild.setChild(currentId, name, checkedArr);
    localStorage.setItem("lastChildId",currentId.toString());

    let exisistingChildren = localStorage.getItem("staticData");
    let appendChild = registerChild.getChild();

    exisistingChildren = exisistingChildren ? JSON.parse(exisistingChildren) : [];
    exisistingChildren.push(appendChild)

    localStorage.setItem("staticData",JSON.stringify(exisistingChildren));

    closeRegisterModal();
    
}


//=========================================================================================================
// Helper functions for Register and SignIn Modal
// 
//
//=========================================================================================================
// get the register form
const openRegisterForm = () => {
    document.querySelector("#registerModal").style.display = "block";
}

// When the user clicks on <span> (x), close the modal
const closeRegisterModal = () => {
    document.querySelector("#registerForm").reset();
    document.querySelector("#registerModal").style.display = "none";
}

// When the user clicks on <span> (x), close the modal
const closeSignInModal = () => {
    document.querySelector("#signInForm").reset();
    document.querySelector("#signInModal").style.display = "none";
}

// When the user clicks on <span> (x), close the modal
const closeSignOutModal = () => {
    document.querySelector("#signOutForm").reset();
    document.querySelector("#signOutModal").style.display = "none";
}
  
// When the user clicks anywhere outside of the modal, close it
const handleClick = (event) => {
    const registerModal = document.querySelector("#registerModal");
    const signInModal = document.querySelector("#signInModal");
    const signOutModal = document.querySelector("#signOutModal");

    if(event.target === registerModal) registerModal.style.display = "none";
    if(event.target === signInModal) signInModal.style.display = "none";
    if(event.target === signOutModal) signOutModal.style.display = "none";
     
}


//=========================================================================================================
// getDailyLog
// Daily log will be updated from the dynamic data. If no data available for the date(new day), dynamic 
// object will be updated from the static object.
// Create display card for each expected child and update the DOM
//
//=========================================================================================================

function getDailyLog(){
    
    document.querySelector(".history").style.display = "none";
    document.querySelector(".daily-log").style.display = "block";

    // get the current date     
    let date = getTodaysDate();

    let expectedChildrens = localStorage.getItem(`${date}`);

    expectedChildrens = expectedChildrens ? JSON.parse(expectedChildrens) : [];

    // create new records from static data
    if(expectedChildrens.length === 0){

        // get the childrens from the local storage and display the one that attends that particular day
        let currentday = daysLUT[new Date().getDay()]; 
        let expectedCount = 0;

        let registeredChildrens = JSON.parse(localStorage.getItem("staticData"));      
    
        for(let i in registeredChildrens){

            const days = registeredChildrens[i].days;

            if(days.includes(currentday)){
                childLogInfo[expectedCount] = {};
                childLogInfo[expectedCount].id = registeredChildrens[i].id;
                childLogInfo[expectedCount].name = registeredChildrens[i].name;
                childLogInfo[expectedCount].date = date;
                childLogObj_G.push(childLogInfo[expectedCount]);
                expectedCount++;
            }
        }

        // Update the local storage with the dynamic data
        for(let i=0; i<childLogObj_G.length; i++){
            updateDynamicDataByDate(childLogObj_G[i]);
        }
        expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));
    }

    createExpectedChildCard(expectedChildrens); 
    updateDailyLog();
}

//=========================================================================================================
// createExpectedChildCard()
// For each expected child, create DOM element and update the daily log content
//
//=========================================================================================================

function createExpectedChildCard(expectedChildrens){

    let dailyLog = document.querySelector("#dailyLogContent");
    
    // Clear the div before making new one
    dailyLog.innerHTML = " ";

    if (expectedChildrens){
        for(let i=0; i<expectedChildrens.length; i++){
            dailyLog.appendChild(getChildCard(expectedChildrens[i]));
            document.querySelectorAll(".sign-in-btn")[i].addEventListener("click",signInSignOutToggle);
        }
    }
    else{
        dailyLog.innerHTML = "No childrens are expected today!";
    }

}

//=========================================================================================================
// getChildCard()
// For each expected child, create DOM element and update the daily log content
//
//=========================================================================================================

function getChildCard(expectedChildren){

    
    let contentCard = document.createElement("div");
    contentCard.className = "daily-log-content-card";
    // contentCard.id = `dailyLogId${}`

    // iconContainer
    let iconContainer = document.createElement("div");
    iconContainer.className = "icon-container";

    let img = document.createElement("img");
    img.src = "./images/img1.jpg";
    img.alt= "kid photo";
    iconContainer.appendChild(img);

    let statusCircle = document.createElement("div");
    statusCircle.className = "status-circle";
    iconContainer.appendChild(statusCircle);

    // card details
    let cardDetails = document.createElement("div");
    cardDetails.className = "card-details";

    let p1 = document.createElement("p");
    p1.textContent = expectedChildren.name;
    let p2 = document.createElement("p");
    p2.textContent = 'Signed out';
    p2.id = "daily-log-child-status";

    cardDetails.appendChild(p1);
    cardDetails.appendChild(p2); 

    //button
    let btn = document.createElement("button");
    btn.textContent = "Sign in";
    btn.className = "sign-in-btn";
    btn.id = `dailyLogChildId${expectedChildren.id}`;
    // console.log(btn.id);
    // btn.id = expectedChildren.id;
    btn.value = expectedChildren.id;

    contentCard.appendChild(iconContainer);
    contentCard.appendChild(cardDetails);
    contentCard.appendChild(btn);

    return contentCard;

}

{/* <div class="daily-log-content-card">
    <div class="icon-container">
        <img src="./images/img1.jpg">
        <div class="status-circle"></div>
    </div>
    <div class="card-details">
        <p>Priscilla</p>
        <p>Signed out</p>
    </div>
    <button class="sign-in-btn">Sign in</button>
</div> */}

//=========================================================================================================
// updateDailyLog()
// This will update the status of the children, everytime they do sign-in, sign-out or mark them as absent
// in the child card display status.
//
//=========================================================================================================

function updateDailyLog(){

    let date = getTodaysDate();
    let expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));

    for(let i=0; i<expectedChildrens.length; i++)
    {
        let logStatus = "";
        let signBtnStyle = "";

        let id =  expectedChildrens[i].id;

        let absent = expectedChildrens[i].absent;

        if(absent === true)
        {
            logStatus = `Absent`; 
            signBtnStyle = 'remove';
        }
        else {

            let inTime = expectedChildrens[i].inTime;
            let outTime = expectedChildrens[i].outTime;
            
            if(outTime){
                logStatus = `Signed in at ${inTime} \n Signed out at ${outTime}`  ; 
                signBtnStyle = 'remove';
            }
            else if(inTime){
                logStatus = `Signed in at ${inTime}`; 
                signBtnStyle = 'signout';
            }
        }
        document.querySelectorAll("#daily-log-child-status")[i].innerHTML = logStatus;
        styleSignBtns(signBtnStyle, id);
    }
}

//=========================================================================================================
// signInSignOutToggle
// One button is used to toggle between Sign-in and Sign-out
//
//=========================================================================================================

function signInSignOutToggle(event){

    const userId = event.target.value;
    const signBtn = document.querySelector(`#dailyLogChildId${userId}`);

    if(signBtn.textContent === 'Sign in')
        signInUser(event);
    else
        signOutUser(event);

}

//=========================================================================================================
// signInUser
// Sign-in user modal will pop out.
//
//=========================================================================================================

function signInUser(event){

    const userId = event.target.value;
     
    document.querySelector('#signInModal').style.display = "block";

    let signInModal = document.querySelector(".modal-signIn");

    let h2 = document.querySelector("#signInHeading");
    h2.textContent = `Are you sure you want to sign in ${getUserName(userId)}?`;

    let signInLabel = document.querySelector("#signInLabel");
    signInLabel.textContent = getTodaysDate();

    // set the child ID in the signIn form hidden field to pass it to confirm-signIn
    document.querySelector("#signInChildId").value = userId;

}

//=========================================================================================================
// signOutUser
// Sign-out user modal will pop out.
//
//=========================================================================================================

function signOutUser(event){
    const userId = event.target.value;
     
    // open a modal for sign in
    document.querySelector('#signOutModal').style.display = "block";

    let signOutModal = document.querySelector(".modal-signOut");

    let h2 = document.querySelector("#signOutHeading");
    h2.textContent = `Are you sure you want to sign out  ${getUserName(userId)}?`;

    let signOutLabel = document.querySelector("#signOutLabel");
    signOutLabel.textContent = getTodaysDate();

    // set the child ID in the signIn form hidden field to pass it to confirm-signIn
    document.querySelector("#signOutChildId").value = userId;

}

//=========================================================================================================
// processSignIn
// Process sign in form
//
//=========================================================================================================

function processSignIn(e){
    e.preventDefault();

    let handler = (e.submitter).id;

    (handler === 'signInConfirmBtn') ? 
            confirmSignIn(e) : 
            console.error("In signIn form the triggered element is empty");

}

//=========================================================================================================
// confirmSignIn
// Get the sign-in form details and update the local storage and display log details
//
//=========================================================================================================

function confirmSignIn(e){

    e.preventDefault();

    // Get the sign-in form details and update local storage
    const childId =  parseInt(document.querySelector("#signInChildId").value);
    const date = document.querySelector("#signInLabel").textContent;
    const inTime = document.querySelector("#signInTime").value;

    let expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));

    if(expectedChildrens.length === 0){
        console.error("no dynamic data in confrim sign in form");
    }
    else{

        for(let i in expectedChildrens){
            if(expectedChildrens[i].id ==  childId)
            {
                expectedChildrens[i].date = date;
                expectedChildrens[i].inTime = inTime;

                localStorage.setItem(`${date}`, JSON.stringify(expectedChildrens));
                break;
            }
        }
    
        createExpectedChildCard(expectedChildrens);    
        updateDailyLog();
        
        closeSignInModal();
    
    }

}

//=========================================================================================================
// reportAbsent
// Get the absent form details and update the local storage and daily log details
//
//=========================================================================================================

function reportAbsent(e){
    e.preventDefault();

    const childId =  parseInt(document.querySelector("#signInChildId").value);
    const date = document.querySelector("#signInLabel").textContent;
    let expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));

    if(expectedChildrens.length === 0){
        console.error("no dynamic data in confrim sign in form");
    }
    else{
        for(let i in expectedChildrens){
            if(expectedChildrens[i].id ==  childId)
            {
                expectedChildrens[i].absent = true;

                localStorage.setItem(`${date}`, JSON.stringify(expectedChildrens));
                break;
            }
        }
    }

    createExpectedChildCard(expectedChildrens);
    updateDailyLog();
    closeSignInModal();
}

//=========================================================================================================
// processSignOut
// 
//
//=========================================================================================================

function processSignOut(e){
    e.preventDefault();

    let handler = (e.submitter).id;

    (handler === 'signOutConfirmBtn') ? 
            confirmSignOut(e) : 
            console.error("In signIn form the triggered element is empty");

}

//=========================================================================================================
// confirmSignOut
// Process sign-out form and update the local storage and daily log details 
//
//=========================================================================================================

function confirmSignOut(e){

    e.preventDefault();

    const childId =  parseInt(document.querySelector("#signOutChildId").value);
    const date = document.querySelector("#signOutLabel").textContent;
    const outTime = document.querySelector("#signOutTime").value;

    let expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));

    if(expectedChildrens.length === 0){
        console.error("no dynamic data in confrim sign in form");
    }
    else{
        for(let i in expectedChildrens){
            if(expectedChildrens[i].id ==  childId)
            {
                expectedChildrens[i].outTime = outTime;

                localStorage.setItem(`${date}`, JSON.stringify(expectedChildrens));
                break;
            }
        }

    }
    createExpectedChildCard(expectedChildrens);
    updateDailyLog();
    closeSignOutModal();
}

//=========================================================================================================
// updateDynamicDataByDate
// Update dynamic data in the local storage 
//
//=========================================================================================================

function updateDynamicDataByDate(a_childLogObj){

    let exisistingChildren = localStorage.getItem(`${a_childLogObj.date}`);

    exisistingChildren = exisistingChildren ? JSON.parse(exisistingChildren) : [];

    exisistingChildren.push(a_childLogObj);
    
    localStorage.setItem(`${a_childLogObj.date}`,JSON.stringify(exisistingChildren));
}

//=========================================================================================================
// History
// 
//
//=========================================================================================================

function dispHistory(e){

    document.querySelector(".history").style.display = "block";
    document.querySelector(".daily-log").style.display = "none";
}

function getHistory(e){
    e.preventDefault();

    let  date = document.querySelector('#history-date').value;
    let a = date.split("-");

    date = a[2]+'-'+a[1]+'-'+a[0];

    let expectedChildrens = JSON.parse(localStorage.getItem(`${date}`));

    let historyContent = document.querySelector("#historyLogContent");
    historyContent.innerHTML = "";

    if(expectedChildrens){
        for(let i=0; i<expectedChildrens.length; i++){
            let inTime = expectedChildrens[i].inTime;
            let outTime = expectedChildrens[i].outTime;
            let absent = expectedChildrens[i].absent;
            let logStatus = "";

            if(outTime){
                logStatus = `In at ${inTime} \t Out at ${outTime}`  ; 
            }
            else if(inTime){
                logStatus = `In at ${inTime}`; 
            }

            if(absent === true){
                logStatus = `Absent`; 
            }
            
            if(logStatus){
                let cardDetails = document.createElement("div");
                cardDetails.className = "history-card";

                let p1 = document.createElement("p");
                p1.textContent = expectedChildrens[i].name;
                p1.style.color= "#e48e8e";
                p1.style.fontWeight = "bold";
                let p2 = document.createElement("p");
                p2.textContent = logStatus;
                

                cardDetails.appendChild(p1);
                cardDetails.appendChild(p2); 
                cardDetails.appendChild(document.createElement("br"));

                historyContent.appendChild(cardDetails);
            }

        }

    }
    else{
        historyContent.innerHTML = "No history information available for the chosen date!";
    }

}


//=========================================================================================================
// Helper functions
// 
//
//=========================================================================================================

// Helper functions to style the daily log buttons
function styleSignBtns(action, childId){

    const signBtn = document.querySelector(`#dailyLogChildId${childId}`);

    switch(action){
        case 'remove' : 
            signBtn.remove();
            break;
        case 'signout':
            signBtn.textContent = 'Sign out';
        
            signBtn.style.backgroundColor = 'white';
            signBtn.style.color = '#e48e8e';
            signBtn.style.border = '1px solid #f17a8b';
            break;
        default:
            break;
    }
}

// get todays date in the DD-MM-YYYY format
const getTodaysDate = () => {
    const d = new Date();
    const dateString = ("0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
                        d.getFullYear();
    return dateString;
};

// get user name from static data
function getUserName(id){

    let registeredChildrens = JSON.parse(localStorage.getItem("staticData"));

    for (let i in registeredChildrens){
        if(registeredChildrens[i].id == id){
            return registeredChildrens[i].name;
        }
    }
}

// For debugging
function displaychildLogObj(){
    for (let i in childLogObj_G){
        console.log(childLogObj_G[i]);
    }
}