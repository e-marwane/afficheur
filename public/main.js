

import { InfluxDB } from "./index.browser.mjs";
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

async function energyDataAsync() {
  try {
    const response = await fetch("/ApiAfficheurdynimac/energy");
    const data = await response.json();
    console.log("Energy Data:", data);

    if (data.data && data.data.length > 0) {
      const energyData = data.data;
      const latestEnergyData = energyData[energyData.length - 1];
      const secondLatestEnergyData = energyData[energyData.length - 2];

      const latestKwh = latestEnergyData.kwh;
      const secondLatestKwh = secondLatestEnergyData.kwh;

      return [latestKwh, secondLatestKwh];
    } else {
      console.log("The energyData array is empty.");
      return [null, null];
    }
  } catch (error) {
    console.error("Error fetching energy data:", error);
    return null;
  }
}
energyDataAsync()

async function Collecteau() {
  try {
    const queryApi = new InfluxDB({
      url: "https://influx.novatice.com",
      token: "7g22yYxVUMzTH4DRjIVWbIABsjc5eWS7TGAVxtsSN0c5deRq3S5xnFQ0V455W4EgOFqHn164PZZ7QPCbo83lRg==",
    }).getQueryApi("Novatice");

    const currentDate = new Date();
    const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString().slice(0, 10);
    const prevMonth = new Date();
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    prevMonth.setDate(1);
    const firstDayOfPrevMonth = prevMonth.toISOString().slice(0, 10);
    const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0).toISOString().slice(0, 10);
    const today = new Date().toISOString().slice(0, 10);

    const fluxQueries = [
      `from(bucket:"lorawan") |> range(start: ${firstDayOfPrevMonth}, stop: ${lastDayOfPrevMonth}) |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "Index0h00")  |> aggregateWindow(every: 30d, fn: last, createEmpty: false)`,
      `from(bucket:"lorawan") |> range(start: ${firstDayOfCurrentMonth}, stop: ${today}) |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "Index0h00")  |> aggregateWindow(every: 30d, fn: last, createEmpty: false)`,
      `from(bucket:"lorawan") |> range(start: -24h) |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "ForwardFlow_Last24Hours_Sum") |> last()`
    ];

    const promises = fluxQueries.map(async (fluxQuery) => {
      const data = await queryApi.collectRows(fluxQuery);
      return data[data.length - 1]._value;
    });

    const [lastMonthData, currentMonthData, todayData] = await Promise.all(promises);
    console.log("Water Data:", { lastMonthData, currentMonthData, todayData });

    return { lastMonthData, currentMonthData, todayData };
  } catch (error) {
    console.error("Error in Collecteau:", error);
    throw error;
  }
}
Collecteau()

async function dataMeteo(EUI) {
  try {
    const queryApiMeteo = new InfluxDB({
      url: "https://influx.novatice.com",
      token: "7g22yYxVUMzTH4DRjIVWbIABsjc5eWS7TGAVxtsSN0c5deRq3S5xnFQ0V455W4EgOFqHn164PZZ7QPCbo83lRg==",
    }).getQueryApi("Novatice");

    const fluxQuery = `from(bucket:"lorawan") |> range(start: today()) |> filter(fn: (r) => r._measurement == "S2120" and r.DeviceID == "${EUI}")`;

    const data = await queryApiMeteo.collectRows(fluxQuery);
    console.log("Meteo Data:", data);

    const lastValues = {};
    const elementIds = {
      humidity: "#humidite .value",
      uv_index: "#indice_uv .value",
      wind_speed: "#vitesse_du_vent .value",
      temperature: "#temperature .value",
      pressure: "#pression .value",
      illumination: "#luminosite .value",
      wind_direction: "#direction_du_vent .value",
      rain_gauge: "#precipitation .value",
    };

    data.forEach((value) => {
      if (elementIds[value._field] && value._value !== undefined) {
        lastValues[value._field] = value._value;
      }
    });

    console.log("Last Meteo Values:", lastValues);
    return lastValues;
  } catch (error) {
    console.error("Error fetching Meteo data:", error);
    throw error;
  }
}
dataMeteo("2cf7f1c044300040")


export async function getWeatherData() {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Bois-Guillaume&appid=1fc26e02b94a0282e3bdac0f1ed41dd3&units=metric`);
    const data = await response.json();
    console.log("Weather Data:", data);

    return {
      temperature: Math.round(data.main.temp),
      tempMin: data.main.temp_min,
      tempMax: data.main.temp_max,
      humidity: data.main.humidity,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
}
// getWeatherData()

export async function batimentData(EUI) {
  try {
    const response = await fetch(`/ApiAfficheurdynimac/sensors/${EUI}/last`);
    const data = await response.json();
    console.log("Batiment Data:", data);

    if (!data || data.length === 0) {
      console.log(`No data found for collection: ${EUI}`);
      return null; // Return null if no data found
    }

    return data[0]; // Return the first item in the data array

  } catch (error) {
    console.error('Error fetching batiment data:', error);
    return null; // Return null in case of error
  }
}

// batimentData("24e124725c378643");


export { dataMeteo, Collecteau, energyDataAsync };

// ////////////////
// document.querySelector(".Name-school-user > p:nth-child(1)").innerHTML = localStorage.getItem("userID")
// // Initialize Swiper
// const swiper = new Swiper(".swiper-container", {
//   direction: "horizontal",
//   loop: false,
//   navigation: {
//     nextEl: ".swiper-button-next",
//     prevEl: ".swiper-button-prev",
//   },
//   pagination: {
//     el: ".swiper-pagination",
//     clickable: true,
//   },
//   allowTouchMove: false,
// });


// document.getElementById("addButton").addEventListener("click", () => {
//   document.getElementById("ContentApplications").classList.toggle("hidden");
//   document.getElementById("popup").classList.toggle("hidden");
//   document.getElementById("global_choose_layout").style.display = "none"
// });
// /////////////////////

// // Check if there are saved clicked apps and add them to the slider on page load
// window.addEventListener("DOMContentLoaded", async function () {
//   let appHolder = document.querySelectorAll(".image-add");
//   let globalChooseLayout = document.getElementById("global_choose_layout");
  
//   appHolder.forEach((element) => {
//     element.addEventListener("click", function () {
//       document.getElementById("ContentApplications").classList.toggle("hidden");
//       document.getElementById("popup").classList.toggle("hidden");
//       // document.getElementById("popup").classList.toggle("hidden")
//       console.log("clicker");
  
//       // Find the choose_layout div within the clicked appHolder
//       let localChooseLayout = element.querySelector(".choose_layout");
  
//       if (localChooseLayout) {
//         // Display the global choose_layout div
//         globalChooseLayout.style.display = "flex";
  
//         // Update the id attributes of the layout options based on the localChooseLayout div
//         let localLayElements = localChooseLayout.querySelectorAll(".lay_");
//         localLayElements.forEach((layElement, index) => {
//           let globalOption = globalChooseLayout.querySelectorAll(".carreux")[index];
//           if (globalOption) {
//             globalOption.setAttribute("data-appid", layElement.id);
//           }
//         });
  
//         // Add click event listeners to the global choose_layout options
//         let globalLayElements = globalChooseLayout.querySelectorAll(".carreux");
//         globalLayElements.forEach((globalLayElement) => {
//           globalLayElement.addEventListener("click", async function () {
//             var appId = globalLayElement.getAttribute("data-appid");
//             console.log(appId);
  
//             await addCustomHtml(appId);
//             await saveClickedApp(appId);
//             await appendAppToSlideContainer(appId);
  
//             // Hide the global choose_layout after an option is selected
//             globalChooseLayout.style.display = "none";
//           });
//         });
//       }
//     });
//   });
  
//   var savedAppIds = getSavedClickedApps();
//   if (savedAppIds && savedAppIds.length > 0) {
//     for (const appId of savedAppIds) {
//       await addCustomHtml(appId);
//       await appendAppToSlideContainer(appId);
//     }
//   }

//   // Select all sortable container elements
//   const containers = document.querySelectorAll(".sortable-container");

//   // Iterate over each container
//   containers.forEach((container, index) => {
//     // Check the number of div elements within the container
//     const divCount = container.querySelectorAll("div").length;

//     // Calculate the number of divs needed to complete 4
//     const divsNeeded = 4 - divCount;

//     // Add missing divs if needed
//     for (let i = 0; i < divsNeeded; i++) {
//       const div = document.createElement("div");
//       div.classList.add("icon", "placeholder");
//       div.setAttribute("draggable", "true");
//       container.appendChild(div);
//     }

//     const sortableInstance = new Sortable(container, {
//       group: "sortable-items",
//       animation: 150,
//       ghostClass: "sortable-ghost",
//       chosenClass: "sortable-chosen",
//       dragClass: "sortable-drag",
//       onAdd: function (evt) {
//         const placeholder = evt.to.querySelector('[id^="placeholder_"]');
//         const undefinedPlaceholder = evt.to.querySelector('[id^="undefined"]');
//         const isDoubleItem = evt.item.classList.contains("double");
      
//         if ((placeholder || undefinedPlaceholder) && !isDoubleItem) {
//           evt.to.insertBefore(evt.item, placeholder || undefinedPlaceholder ); // Insert item before the placeholder
//           evt.to.removeChild(placeholder || undefinedPlaceholder); // Remove the placeholder
//         } else {
//           // Swap the dragged item with an existing one
//           const existingItem = evt.to.querySelector(".icon");
//           if (existingItem) {
//             if (isDoubleItem) {
//               // Handle the case when the dragged item is a double item
//               // Do something specific for double items here, like displaying an error message or preventing the swapping
//             } else {
//               const temp = existingItem.cloneNode(true); // Clone the existing item
//               evt.item.parentNode.replaceChild(temp, evt.item); // Replace the dragged item with the cloned existing item in the original list
//               existingItem.parentNode.replaceChild(evt.item, existingItem); // Replace the existing item with the dragged item in the destination list
//             }
//           }
//         }
      
//         updateLocalStorageOrder(containers);
//         removeConsecutivePlaceholders();
//       },

//       onRemove: function (evt) {
//         const maxElements = 6; // Set the maximum number of elements per container
//         if (evt.from.children.length < maxElements) {
//           const placeholder = document.createElement("div");
//           placeholder.className = "icon placeholder";
//           evt.from.appendChild(placeholder);
//         }
//         updateLocalStorageOrder(containers);
//         removeConsecutivePlaceholders()

//       },
//       onEnd: function (evt) {
//         updateLocalStorageOrder(containers);
//         removeConsecutivePlaceholders()
//         window.location.reload(); // Reload the page
//       },
//     });

//     // Store the Sortable instance reference
//     container.sortableInstance = sortableInstance;
//     function updateLocalStorageOrder(containers) {
//       const newOrder = [];
//       containers.forEach((container) => {
//           const items = Array.from(container.children);
//           const appIds = items
//               .filter(
//                   (element) =>
//                       element.classList.contains("icon") &&
//                       !element.classList.contains("placeholder")
//               )
//               .map((element) => element.id);
//           let doubleCount = 0;
//           items.forEach((element) => {
//               if (element.classList.contains('double')) {
//                   doubleCount++;
//               }
//           });
//           const placeholderCount = 6 - appIds.length - doubleCount;
//           const placeholderIds = Array.from(
//               { length: placeholderCount },
//               (_, index) => `placeholder_${index + 1}`
//           );
//           newOrder.push(...appIds, ...placeholderIds);
//       });
//       localStorage.setItem("clickedAppIds", JSON.stringify(newOrder));
//   }
  
  
//   });


//   // Variable to store the sorting state
//   let isSortingEnabled = true;
//   let showAlertTriggered = false; // Flag to track if showAlert() has been triggered
  
//   function showAlert() {
//       handleDeleteClick();
//       editbutton();
//       showAlertTriggered = true; // Set the flag to true when showAlert() is triggered
//   }
  
//   function editbutton(event) {
//       toggleTouchMove();
  
//       isSortingEnabled = !isSortingEnabled;
  
//       containers.forEach((container) => {
//           const sortableInstance = container.sortableInstance;
//           sortableInstance.option("disabled", !isSortingEnabled);
//       });
  
//       if (isSortingEnabled) {
//           window.removeEventListener("mousemove", handleMouseMove);
//           window.addEventListener("pointermove", handlePointerMove, { passive: true }); // Ajout de { passive: true }
//       } else {
//           window.removeEventListener("pointermove", handlePointerMove);
//           window.addEventListener("mousemove", handleMouseMove, { passive: true }); // Ajout de { passive: true }
//       }
//   }
  
//   function toggleTouchMove() {
//       let icon = document.querySelectorAll(".icon");
//       icon.forEach((element) => {
//           element.addEventListener("contextmenu", (event) => {
//               event.preventDefault();
//               showAlert();
//           });
  
  
//           element.classList.toggle("shake");
//       });
//       swiper.allowTouchMove = !swiper.allowTouchMove;
//   }
  
//   document.addEventListener("click", (event) => {
//       if (showAlertTriggered) {
//           editbutton(event);
//           handleDeleteClick(event);
//           showAlertTriggered = false; // Reset the flag after handling the click event
//       }
//   });
  
//   editbutton();
  
  
//   // Function to handle pointermove event
//   let isSlideChangeInProgress = false;

//   function handlePointerMove(event) {
//       const edgeThresholdR = 40; // Increase this value to widen the edge threshold
//       const edgeThresholdL = 40; // Increase this value to widen the edge threshold
//       console.log(window.innerWidth);
//       const mouseX = event.clientX;
  
//       if (Sortable.active && !isSlideChangeInProgress) {
//           if (mouseX < edgeThresholdR) {
//               isSlideChangeInProgress = true;
//               swiper.slidePrev();
//           } else if (mouseX > window.innerWidth - edgeThresholdL) {
//               isSlideChangeInProgress = true;
//               swiper.slideNext();
//           }
//       }
//   }
  
//   // Add an event listener for the 'slideChangeTransitionEnd' event
//   swiper.on('slideChangeTransitionEnd', function() {
//       isSlideChangeInProgress = false;
//   });
  

//   // Function to handle mousemove event
//   function handleMouseMove(event) {
//   }
//   swiper.on("slideChange", function () {
//     if (Sortable.active) {
//       const activeSortable = Sortable.active;
//       const sortableElement = activeSortable.el;
//       console.log("object", event.clientY, event.clientX, sortableElement);
//       document.querySelector(
//         ".icon.sortable-drag"
//       ).style.left = `${event.clientX}px`;
//     }
//   });
//   swiper.on("slideChangeNext", function () {
//     if (Sortable.active) {
//       document.querySelector(
//         ".icon.sortable-drag"
//       ).style.left = `${event.clientX}px`;
//       console.log("true");
//     }
//   });
//   swiper.on("slideChangePrev", function () {
//     if (Sortable.active) {
//       document.querySelector(
//         ".icon.sortable-drag"
//       ).style.right = `${event.clientX}px`;
//     }
//   });

//   // Update Swiper after appending the missing divs
//   swiper.update();

//   async function addCustomHtml(appId) {
//     try {
//       var customHtml = await createCustomHtml(appId);

//       // Do something with customHtml
//     } catch (error) {
//       console.error("Error creating custom HTML:", error);
//     }
//   }

// //   // Use async/await with the createCustomHtml function
// async function appendAppToSlideContainer(appId) {
//   try {
//     const slidesContainer = document.querySelector(".swiper-wrapper");
//     const newAppElement = document.createElement("div");
//     newAppElement.classList.add("icon");
//     newAppElement.setAttribute("draggable", "true");
//     newAppElement.id = appId;

//     const customHtml = await createCustomHtml(appId);
//     newAppElement.innerHTML = customHtml;

//     const elementsWithDoubleClass = newAppElement.querySelectorAll('.double');
//     elementsWithDoubleClass.forEach(element => {
//       const parentIcon = element.closest('.icon');
//       if (parentIcon) {
//         parentIcon.classList.add('double');
//       }
//     });

//     const sortableContainers = slidesContainer.querySelectorAll(".sortable-container");
//     let targetSortableContainer;

//     for (let i = 0; i < sortableContainers.length; i++) {
//       const sortableContainer = sortableContainers[i];
//       let childCount = 0;
//       Array.from(sortableContainer.children).forEach(child => {
     

//         childCount += child.classList.contains('double') ? 2 : 1;
//       });

//       // Check if adding the new app (regular or double) would exceed the maximum limit of 6 icons
//       if (childCount + (newAppElement.classList.contains('double') ? 2 : 1) <= 6) {
//         targetSortableContainer = sortableContainer;
//         break;
//       }
//     }

//     // If there is no available slot, move to the next slide
//     if (!targetSortableContainer) {
//       const newSlide = document.createElement("div");
//       newSlide.classList.add("swiper-slide");
//       newSlide.style.width = "375px";

//       targetSortableContainer = document.createElement("div");
//       targetSortableContainer.classList.add("sortable-container");

//       newSlide.appendChild(targetSortableContainer);
//       slidesContainer.appendChild(newSlide);
//     }

//     targetSortableContainer.appendChild(newAppElement);

//     swiper.update();
//   } catch (error) {
//     console.error("Error appending app to slide container:", error);
//   }
// }




// });

// let asyncOperationCounter = 0;

// function showLoader() {
//   const loaderParent = document.querySelector(".loader-parent");
//   loaderParent.style.display = "none"; // Assuming your loader is a flex container
// }

// function hideLoader() {
//   const loaderParent = document.querySelector(".loader-parent");
//   loaderParent.style.display = "none";
// }
// function createCustomHtml(appId) {
//   return new Promise(async (resolve, reject) => {
//     asyncOperationCounter++; // Increment the counter when starting an async operation*
//     showLoader();
//     switch (appId) {
//       case "app1":
//         try {
//           const html = `<a href="/milesight"><p class="place-name">Bureau com</p>
            
//             <div class="values-statu">
//               <div class="oxy">
//                 <div class="text-des"><p>CO2</p><span class="etat vert">Très bien</span></div>
//                 <div class="circle-wrapper">
//                   <div class="circle-fill vert"> 
//                   <svg id="Type_Climate_Sensor_Progress_InProgress_Size_Small" data-name="Type=Climate Sensor, Progress=InProgress, Size=Small" xmlns="http://www.w3.org/2000/svg" width="39.088" height="30.668" viewBox="0 0 39.088 30.668">
//   <circle id="Ellipse_3710" data-name="Ellipse 3710" cx="2.359" cy="2.359" r="2.359" transform="translate(17.522)" fill="#fff"/>
//   <g id="Groupe_10978" data-name="Groupe 10978" transform="translate(0 0.182)" opacity="0.994">
//     <path id="Tracé_51660" data-name="Tracé 51660" d="M22.959,4.513A3.709,3.709,0,0,0,22.965.39a19.544,19.544,0,0,1,13.28,29.394,2.022,2.022,0,0,1-3.455-2.1,15.5,15.5,0,0,0-9.83-23.171Zm-6.235-.122A15.5,15.5,0,0,0,5.934,27.051a2.022,2.022,0,0,1-3.55,1.935A19.544,19.544,0,0,1,16.88.271a3.709,3.709,0,0,0-.156,4.12Z" transform="translate(0 -0.271)" fill="#73bc63" fill-rule="evenodd"/>
//   </g>
// </svg>

                
//                   </div>
//                 <p class="oxy-value">1607 <span class="petit">
//                   <img src="./img/co2img.svg" />
//                 </span></p>
//                 </div>
//               </div>
//               <div class="humidite">
//                 <div class="text-des"> <p>Humidité</p><span class="etat orange">Modéré</span></div>
//                 <div class="circle-wrapper">
//                   <div class="circle-fill orange"> 
//                   <svg id="Groupe_10970" data-name="Groupe 10970" xmlns="http://www.w3.org/2000/svg" width="38.335" height="29.376" viewBox="0 0 38.335 29.376">
//   <path id="Tracé_51651" data-name="Tracé 51651" d="M11.882,5.825A15.2,15.2,0,0,1,33.4,24.511a3.641,3.641,0,0,1,3.654,1.547A19.168,19.168,0,1,0,2.338,28.342a1.983,1.983,0,0,0,3.482-1.9A15.2,15.2,0,0,1,11.882,5.825Z" transform="translate(0 0)" fill="#d89437" fill-rule="evenodd"/>
// </svg>

//                   </div>
//                   <p class="humidite-value" id="humid-val">
//                   56%<span class="petit"><img class="co2img" src="./img/humiditeimg.svg" /></span></p>
//                 </div>
//               </div>
//               <div class="temp">
//               <div class="text-des"><p>Température</p><span class="etat rouge">Mauvais</span></div>
//               <div class="circle-wrapper">
//                   <div class="circle-fill rouge"> 
//                   <svg id="Groupe_10973" data-name="Groupe 10973" xmlns="http://www.w3.org/2000/svg" width="38.515" height="30.218" viewBox="0 0 38.515 30.218">
//   <path id="Tracé_51654" data-name="Tracé 51654" d="M11.938,5.853A15.273,15.273,0,0,1,32.309,27.191a1.992,1.992,0,0,0,3.4,2.07A19.258,19.258,0,0,0,8.161,3.518a3.655,3.655,0,0,1,2.451,3.149A15.273,15.273,0,0,1,11.938,5.853Zm-5.271,4.76A3.655,3.655,0,0,1,3.518,8.161q-.368.522-.7,1.069a19.258,19.258,0,0,0-.467,19.244,1.992,1.992,0,0,0,3.5-1.907,15.273,15.273,0,0,1,.371-15.262Q6.433,10.952,6.667,10.612Z" transform="translate(0 0)" fill="#d84937" fill-rule="evenodd"/>
// </svg>

//                   </div>  
//               <p class="temp-value">18°<span class="petit"><img class="co2img" src="./img/tempimg.svg" /></span></p>
//               </div>
//               </div>
//             </div>
//             <p class="statut statutabs">Qualité de l'air
//             </p>
//             </a>`;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app2":
//         try {
//           const html = `
//                 <a href="/milesight">
//                   <p class="place-name">Bureau com</p>
                  
//                   <div class="pic-indice">
//                   <canvas style="width: 480px;height: 140px;" class="bienEtreGraph" id="foo"></canvas> </div>
//                   <div class="lettre-statu">
//                     <p class="indice">Indice bien-être</p>
//                     <p id="etat-indice" class="etat-indice">Très bien</p>
//                   </div>
//                   <p class="statut statutabs">Qualité de l'air
//             </p>
//                 </a>
                
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app3":
//         try {
//           const apiImage = await fetchLastImageFilename();
//           const projectName = await fetchAndFilterProjects();

//           const html = `<a href="/serremobile">
//                 <p class="exp-name">${projectName || "Pas d'expérience"}</p>
//                 <img src="/serres/visionneuse/${apiImage}"/>
//                 <p class="statut statutabs">Serre connectée
//             </p>
//                 </a>
                
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app4":
//         try {
//           const apiDonner = await fetchLastMqttData(
//             "5d09f0ae-fed4-400f-b3ee-55471e2e8c22"
//           );
//           const projectName = await fetchAndFilterProjects();
//           let pumpValueText;
//           const pumpValue = apiDonner.data.value.pump;
//           if (pumpValue > 2100) {
//               pumpValueText = "100%";
//           } else if (pumpValue < 1450) {
//               pumpValueText = "0%";
//           } else {
//               pumpValueText = (((2100 - pumpValue) / 650) * 100).toFixed(1) + "%";
//           }
//           const html = `
//           <a href="/serremobile">
                 
//                  <p class="exp-name">${projectName || "Pas d'expérience"}</p>
//                  <div class="donnés">
//                  <div class="consomation-value">
//                  <div class="donnees-all chart-popup_home">
//                    <p>Humidité sol</p>
//                    <div class="donnees-one">
//                      <div class="img-sol"><img src="./img/sol-s.svg" /></div>
//                      <span id="valsol">${pumpValueText}</span>
//                    </div>
//                  </div>
//                  <div class="donnees-all chart-popup_home">
//                    <p>Humidité air</p>
//                    <div class="donnees-one">
//                      <div class="img-ai"r><img src="./img/air-s.svg" /></div>
//                      <span id="valair">${apiDonner.data.value.cloud[1].toFixed(
//                        1
//                      )}%</span>
//                    </div>
//                  </div>
                 
//                </div>
//                <div class="consomation-value">
//                  <div class="donnees-all chart-popup_home">
//                    <p>Température</p>
//                    <div class="donnees-one">
//                      <div class="img-temp"><img src="./img/temp-s.svg" /></div>
//                      <span id="valtemp">${apiDonner.data.value.cloud[2].toFixed(
//                        1
//                      )}°C</span>
//                    </div>
//                  </div>
//                  <div class="donnees-all chart-popup_home">
//                    <p>Photorésistance</p>
//                    <div class="donnees-one">
//                      <div class="img-resi"><img src="./img/photoresis-s.svg" /></div>
//                      <span id="vallum">${apiDonner.data.value.cloud[3].toFixed(
//                        1
//                      )} </span>
//                    </div>
//                  </div>
//                </div>
   
//                  </div>
//                  <p class="statut statutabs">Serre connectée
//             </p>
//                  </a>
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app5":
//         try {
//           const apiMeteo = await dataMeteo("2cf7f1c044300040");
//           const windDirectionText = getWindDirectionText(
//             apiMeteo.wind_direction
//           );
//           const tempicon = await getWeatherData()
//           const html = `
//              <a href="/meteomobile">
//                   <p class="name-city">
//                     Bois-guillaume
//                   </p>
                  
//                   <div class="ele-center">
//                     <p class="meteo-val"><img src="${tempicon[0]}" />${tempicon[1]}<span class="unit">°</span></p>
//                     <div class="direction">
//                       <p class="dir-valeur"><img src="./img/Groupe 8607.svg">${apiMeteo.humidity}%</p>
//                       <p class="dir-valeur"><img src="./img/windy.svg">${apiMeteo.wind_speed} km/h</p>

//                     </div>

//                   </div>
//                   <p class="statut statutabs">Météo
//             </p>
//                </a>
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app6":
//         try {
//           const apiGaz = await fetchGazData();
//           const html = `
//           <a href="/energiemobile">
//                 <p class="para-gaz">Novatice Technologies</p>
//                 <div class="pic-gaz">
//                   <p class="value-gaz">
//                     ${apiGaz || ".."} <span class="unit-elg">kWh</span> <br>

//                   </p>
//                   <img class="GazGraph" src="./img/gaz.svg"/> 
//                 </div>
//                  <span class="span3">En baisse <img class="flechevert" src="./img/flechehaut.svg" /></span>
//                   <span class="date">Ce mois-ci</span>
//                 <p class="statut statutabs">Gaz
//             </p>
//                 </a>
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app7":
//         try {
//           const [latestKwh, secondLatestKwh] = await energyDataAsync();
//           const html = `
//           <a href="/energiemobile">
//                 <p class="para-elec">Novatice Technologies</p>
//               <div class="pic-elec">
//                 <p class="value-elec">
//                  ${latestKwh} <span class="unit-elg">kWh</span>
               
//                 </p>
//                 <img class="elecGraph" src="./img/elec.svg"/> 
//               </div>
//                <span class="span3">En baisse <img class="flechevert" src="./img/flechebas.svg" /></span>
//                 <span class="date">Ce mois-ci</span>
//               <p class="statut statutabs">Électricité
//             </p>
//               </a>
//                 `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//       case "app8":
//         try {
//           const { lastMonthData, currentMonthData, todayData } = await Collecteau();
          
//           // Convert currentMonthData to m³ if it exceeds 1000 L
//           let displayValue;
//           let unit;
//           if (currentMonthData > 1000) {
//               displayValue = (currentMonthData / 1000).toFixed(2); // Convert to m³ and format to 2 decimal places
//               unit = 'm³';
//           } else {
//               displayValue = currentMonthData;
//               unit = 'L';
//           }
      
//           const html = `
//               <a href="/energiemobile">
//                   <p class="para-eau">Novatice Technologies</p>
//                   <div class="pic-eau">
//                       <p class="value-eau">
//                           ${displayValue} <span class="unit-elg">${unit}</span> <br>
//                       </p>
//                       <img class="eauGraph" src="./img/eau.svg"/> 
//                   </div>
//                   <span class="span3">En baisse <img class="flechevert" src="./img/flechebas.svg" /></span>
//                   <span class="date">Ce mois-ci</span>
//                   <p class="statut statutabs">Eau</p>
//               </a>
//           `;
//           resolve(html);
//         } catch (error) {
//           reject(error);
//         }
//         break;
//         case "app9":
//           try {
//             const apiDonner = await fetchLastMqttData(
//               "5d09f0ae-fed4-400f-b3ee-55471e2e8c22"
//             );
//             const apiImage = await fetchLastImageFilename();
//             const projectName = await fetchAndFilterProjects();
//             let pumpValueText;
//             const pumpValue = apiDonner.data.value.pump;
//             if (pumpValue > 2100) {
//                 pumpValueText = "100%";
//             } else if (pumpValue < 1450) {
//                 pumpValueText = "0%";
//             } else {
//                 pumpValueText = (((2100 - pumpValue) / 650) * 100).toFixed(1) + "%";
//             }
//             const html = `
//             <a href="/serremobile">
//             <div class="card-header double">
//             <div>
//               <div class="card-title">NEOS Serre</div>
//               <div class="card-subtitle">Suivi temps réel</div>
//             </div>
           
//           </div>
//           <div class="card-body">
//             <div class="card-content">
//                 <div class="info-g">
//                     <div class="info-text">Humidité sol</div>
//                     <div class="info">
//                     <div class="icon-bg humidsol">
//                         <img class="img-info" src="./img/sol-s.svg" />
//                         </div>
//                     <div>
//                         <div class="info-number">${pumpValueText}</div>
//                     </div>
//                     </div>
//                 </div>
//                 <div class="info-g ">
//                     <div class="info-text">Humidité air</div>
//                     <div class="info">
//                         <div class="icon-bg humid">
//                             <img class="img-info" src="./img/air-s.svg" />
//                             </div>
//                         <div>
                            
//                             <div class="info-number">${apiDonner.data.value.cloud[1].toFixed(
//                               1
//                             )}%</div>
//                         </div>
//                     </div>
//                 </div>
                
//                 <div class="info-g">
//                     <div class="info-text">Température</div>
//                     <div class="info">
        
//                     <div class="icon-bg temp">
//                         <img class="img-info" src="./img/temp-s.svg" />
//                         </div>
//                     <div>
//                         <div class="info-number">${apiDonner.data.value.cloud[2].toFixed(
//                           1
//                         )}°C</div>
//                     </div>
//                     </div>
//                 </div>
//                 <div class="info-g">
//                     <div class="info-text">Luminosité</div>
//                 <div class="info">
//                 <div class="icon-bg photores">
//                     <img class="img-info" src="./img/photoresis-s.svg" />
//                     </div>
//                 <div>
//                     <div class="info-number">${apiDonner.data.value.cloud[3].toFixed(
//                       1
//                     )} </div>
//                 </div>
//             </div>
//                 </div>
            
//           </div>
//           <div class="card-image-container">
//             <div class="card-image-title">Cornichon</div>
//             <img src="/serres/visionneuse/${apiImage}"/>
//           </div>
//           </div>
//           <p class="statut statutabs">Serre connectée
//             </p>
//           </a>
//                   `;
//             resolve(html);
//           } catch (error) {
//             reject(error);
//           }
//           break;
//           case "app10":
//             try {
//               const [latestKwh, secondLatestKwh] = await energyDataAsync();
//               const html = `
//               <a href="/energiemobile">
//               <div class="card-header double">
//                 <div class="card-title">Novatice Technologies</div>
//                 <div class="card-title-petit">(Électricité)</div>

                
//               </div>
//               <div class="card-content_eau">
//                 <div class="general">
//                   <div><p>Aujourd'hui:</p> <p class="valeur"> -- <span> kWh</span></p></div>
//                   <div><p>Ce mois-ci:</p> <p class="valeur">${latestKwh}<span>kWh</span></p></div>
//                   <div><p>Mois dernier:</p> <p class="valeur">${secondLatestKwh} <span>kWh</span></p></div>
//                 </div>
//                 <div><img class="" src="./img/electricite.svg" /></div>
//               </div>
//               <p class="statut statutabs">Électricité
//             </p>
//               </a>
//                     `;
//               resolve(html);
//             } catch (error) {
//               reject(error);
//             }
//             break;
//             case "app11":
//               try {
//                 const html = `
//                 <a href="/energiemobile">
//                 <div class="card-header double">
//                    <div class="card-title">Novatice Technologies</div>
//                     <div class="card-title-petit">(Gaz)</div>

                  
//                 </div>
//                 <div class="card-content_eau">
//                   <div class="general">
//                     <div><p>Aujourd'hui:</p> <p class="valeur">62 <span>kWh</span></p></div>
//                     <div><p>Ce mois-ci:</p> <p class="valeur">384 <span>kWh</span></p></div>
//                     <div><p>Mois dernier:</p> <p class="valeur">371 <span>kWh</span></p></div>
//                   </div>
//                   <div>
//                   <i class="fas fa-fire fire-icon icone"></i>
//                   </div>
//                 </div>
//                 <p class="statut statutabs">Gaz
//             </p>
//                 </a>
//                       `;
//                 resolve(html);
//               } catch (error) {
//                 reject(error);
//               }
//               break;
//               case "app12":
//                 try {
//                   const { lastMonthData, currentMonthData, todayData } = await Collecteau();
//                   const html = `
//                   <a href="/energiemobile">
//                   <div class="card-header double">
//                     <div class="card-title">Novatice Technologies</div>
//                     <div class="card-title-petit">(Eau)</div>

                    
//                   </div>
//                   <div class="card-content_eau">
//                     <div class="general">
//                     <div><p>Aujourd'hui:</p> <p class="valeur">${todayData} <span>litres</span></p></div>
//                     <div><p>Ce mois-ci:</p> <p class="valeur">${currentMonthData} <span>litres</span></p></div>
//                     <div><p>Mois dernier:</p> <p class="valeur">${lastMonthData} <span>litres</span></p></div>
//                     </div>
//                     <div>
//                     <div><i class="fas fa-tint water-icon icone"></i></div>
//                     </div>
//                   </div>
//                   <p class="statut statutabs">Eau
//             </p>
//                   </a>
//                         `;
//                   resolve(html);
//                 } catch (error) {
//                   reject(error);
//                 }
//                 case"app13" :
//                 try {
//                   const apiMeteo = await dataMeteo("2cf7f1c044300040");
//                   const windDirectionText = getWindDirectionText(
//                     apiMeteo.wind_direction
//                   );
//                   const tempicon = await getWeatherData()

//                   const html = `
//                   <a href="/meteomobile">
                
//                   <div class="card-header double">
//                     <div class="card-title">Bois-Guillaume</div>
//                     <div class="card-title-petit">Seine-maritime(76)</div>                   
//                   </div>
//                   <div class="station">
//                     <div class="station_value">
//                     <div class="img-meteoo">
//                       <img src="${tempicon[0]}" />
//                       <p class="meteo-val">${tempicon[1]}<span class="unit">°</span></p>
//                     </div>
//                     <div class="donne-meteo">
//                        <!-- <div data-value="temperature"><div class="img-meteo"><img src="./img/Groupe 8609.svg"></div><span>${apiMeteo.temperature}°c</span>Température</div> -->
//                         <div data-value="humidity">Humidité<span><br>${apiMeteo.humidity}%</span></div>
//                         <div data-value="rain_gauge">Précipitation<br><span>${apiMeteo.rain_gauge}</span></div>
//                         <!-- <div data-value="pressure"><div class="img-meteo"><img src="./img/Groupe 8614.svg"></div><span>${apiMeteo.pressure}</span>Pression</div> -->
//                         <div data-value="wind_speed">Vitesse Vent<br><span>${apiMeteo.wind_speed} km/h </span></div>
//                         <div data-value="wind_direction" id="direction">Direction Vent<br><span>${windDirectionText}</span></div>
                        
//                        <!--  <div data-value="illumination"><div class="img-meteo"><img src="./img/Groupe 8611.svg"></div><span>${apiMeteo.illumination}</span>Luminosité</div> -->
//                         <!-- <div data-value="uv_index"><div class="img-meteo"><img src="./img/Groupe 8615.svg"></div><span>${apiMeteo.uv_index}</span>Indice UV</div> -->
//                     </div>
//                     </div>
//                   </div>
//                   <p class="statut statutabs">Météo
//             </p> 
//                   </a>
//                   `;
//                 resolve(html);
//                 } catch(error) {
//                   reject(error);
//                 }
                
//                 break;
//                 case "app14":
//                   try {
//                     const response = await  batimentData2("24e124725c378643");
//                     const temperature = response.temperature;
//                     const humidity = response.humidity;
//                     const co2 = response.co2;
                   
                
//                     const html = `
//                     <a href="/milesight">
//                     <div class="card-header double">
//                     <div class="card-title">Bureau C.</div>
//                     <div class="card-title-petit">Relevé qualité de l'air</div>
//                   </div>
//                       <div class="values-statu rectangulaire">
//                         <div class="oxy">
                          
//                           <div class="circle-wrapper">
//                             <div class="circle-fill vert"> 
//                              <svg id="Type_Climate_Sensor_Progress_InProgress_Size_Small" data-name="Type=Climate Sensor, Progress=InProgress, Size=Small" xmlns="http://www.w3.org/2000/svg" width="39.088" height="30.668" viewBox="0 0 39.088 30.668">
//   <circle id="Ellipse_3710" data-name="Ellipse 3710" cx="2.359" cy="2.359" r="2.359" transform="translate(17.522)" fill="#fff"/>
//   <g id="Groupe_10978" data-name="Groupe 10978" transform="translate(0 0.182)" opacity="0.994">
//     <path id="Tracé_51660" data-name="Tracé 51660" d="M22.959,4.513A3.709,3.709,0,0,0,22.965.39a19.544,19.544,0,0,1,13.28,29.394,2.022,2.022,0,0,1-3.455-2.1,15.5,15.5,0,0,0-9.83-23.171Zm-6.235-.122A15.5,15.5,0,0,0,5.934,27.051a2.022,2.022,0,0,1-3.55,1.935A19.544,19.544,0,0,1,16.88.271a3.709,3.709,0,0,0-.156,4.12Z" transform="translate(0 -0.271)" fill="#73bc63" fill-rule="evenodd"/>
//   </g>
// </svg>
                          
//                             </div>
//                           <p class="oxy-value">${co2} <span class="petit"><img  src="./img/co2img.svg" /></span></p>
//                           </div>
//                           <div class="text-des"><p>CO2</p><span class="etat vert">Très bien</span></div>
//                         </div>
//                         <div class="humidite">
//                           <div class="circle-wrapper">
//                             <div class="circle-fill orange"> 
//                              <svg id="Groupe_10970" data-name="Groupe 10970" xmlns="http://www.w3.org/2000/svg" width="38.335" height="29.376" viewBox="0 0 38.335 29.376">
//   <path id="Tracé_51651" data-name="Tracé 51651" d="M11.882,5.825A15.2,15.2,0,0,1,33.4,24.511a3.641,3.641,0,0,1,3.654,1.547A19.168,19.168,0,1,0,2.338,28.342a1.983,1.983,0,0,0,3.482-1.9A15.2,15.2,0,0,1,11.882,5.825Z" transform="translate(0 0)" fill="#d89437" fill-rule="evenodd"/>
// </svg>

//                             </div>
//                             <p class="humidite-value" id="humid-val">
//                             ${humidity}<span class="petit"><img class="co2img" src="./img/humiditeimg.svg" /></span></p>
//                           </div>

//                           <div class="text-des"> <p>Humidité</p><span class="etat orange">Modéré</span></div>
//                         </div>
//                         <div class="temp">
//                         <div class="circle-wrapper">
//                             <div class="circle-fill rouge"> 
//                             <svg id="Groupe_10973" data-name="Groupe 10973" xmlns="http://www.w3.org/2000/svg" width="38.515" height="30.218" viewBox="0 0 38.515 30.218">
//   <path id="Tracé_51654" data-name="Tracé 51654" d="M11.938,5.853A15.273,15.273,0,0,1,32.309,27.191a1.992,1.992,0,0,0,3.4,2.07A19.258,19.258,0,0,0,8.161,3.518a3.655,3.655,0,0,1,2.451,3.149A15.273,15.273,0,0,1,11.938,5.853Zm-5.271,4.76A3.655,3.655,0,0,1,3.518,8.161q-.368.522-.7,1.069a19.258,19.258,0,0,0-.467,19.244,1.992,1.992,0,0,0,3.5-1.907,15.273,15.273,0,0,1,.371-15.262Q6.433,10.952,6.667,10.612Z" transform="translate(0 0)" fill="#d84937" fill-rule="evenodd"/>
// </svg>
//                             </div>  
//                         <p class="temp-value temperatuefunc"> ${temperature}<span class="petit"><img class="co2img" src="./img/tempimg.svg" /></span></p>
//                         </div>

//                         <div class="text-des"><p>Température</p><span class="etat rouge">Mauvais</span></div>
//                         </div>
//                       </div>
//                       <p class="statut statutabs">Qualité de l'air 
//             </p>
//                       </a>
//                       `;
//                     resolve(html);
//                   } catch (error) {
//                     reject(error);
//                   }
//                   break;
//                   case"app15" :
//                   try {
//                     var currentDate = new Date();
  
//                     // Format the date and time
//                     var formattedDate = currentDate.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
//                     var formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    
//                     const html = `
//                     <a href="/milesight">
//                     <div class="card-header double">
//                       <div class="card-title">Bureau Christophe</div>
//                       <div class="card-title-petit"></div>
  
                      
//                     </div>
//                     <div class="all-indices-div">
//                       <div class="statut-indice">
//                         <p>Modéré</p>
//                         <div class="pic-indice">
//                           <canvas style="width: 240px;height: 100px;" class="bienEtreGraph" id="foo2"></canvas> </div>

//                       </div>
//                       <div class="indice-parag">
//                         Indice bien-être selon moyenne pondérée
//                       </p>
//                       <div class="ligne-indice"></div>
//                       <div class="timing-indice">
//                         Dernière actualisation à ${formattedTime}, le ${formattedDate}
//                       </div>
//                     </div>
//                     <p class="statut statutabs">Qualité de l'air 
//             </p>
//                     </a>
//                     `;
//                   resolve(html);
//                   } catch(error) {
//                     reject(error);
//                   }
                  
//                   break;
//                   case"app16" :
//                   try {
//                    const total = await fetchDevices()
//                     const html = `
//                     <div class="appareil-section"><div class="appareil-info"><img src="./img/ipad.png" alt=""><p class="appareil-type">${total} TABLETTES</p></div></div>
//                     `;
//                   resolve(html);
//                   } catch(error) {
//                     reject(error);
//                   }
                  
//                   break;
//                   case"app17":
//                   const html = `
//                   <a href="/videomobile">
//                     <p class="card-title">Tutoriels</p>
//                     <img class="imgCanopeV" src="./img/video.svg" />
//                     <div class="video-section"><p class="nbr-video">
//                     32</p>
//                     <span>Vidéos disponibles</span></div>
//                     <p class="statut statutabs">Vidéos tutoriels
//                     </p>
//                   </a>
                  
//                   `;
//                   resolve(html);
//                   break;
//       default:
//         resolve("");
//     }

//     asyncOperationCounter--; // Decrement the counter when an async operation is complete

//     // If all async operations are complete, hide the loader
//     if (asyncOperationCounter === 0) {
//       hideLoader();
//     }
//   });
// }

// function saveClickedApp(appId) {
//   // Check if appId is null or empty
//   if (appId == null || appId.trim() === "") {
//     return; // Exit the function if appId is null or empty
//   }

//   let savedAppIds = getSavedClickedApps() || [];

//   if (savedAppIds.includes(appId)) {
//     alert("L'application existe déjà.");
//     return; // Exit the function if the ID already exists
//   }
  
//   const firstPlaceholderIndex = savedAppIds.findIndex((id) =>
//     id.startsWith("placeholder_")
//   );

//   if (firstPlaceholderIndex !== -1) {
//     savedAppIds[firstPlaceholderIndex] = appId;
//   } else  {
//     savedAppIds.push(appId);
//   }

//   localStorage.setItem("clickedAppIds", JSON.stringify(savedAppIds));
//   window.location.reload();
// }


// function checkLength() {
//   const clickedAppIds = JSON.parse(localStorage.getItem("clickedAppIds"));
//   if (clickedAppIds === null) {
    
//     hideLoader()
//   } else {
//   if (clickedAppIds.length === 1) {
//     const placeholders = Array.from(
//       { length: 6 },
//       (_, index) => `placeholder_${index}`
//     );
//     const placeholdersHtml = placeholders.join("");
//     localStorage.setItem(
//       "clickedAppIds",
//       JSON.stringify(clickedAppIds.concat(placeholders))
//     );
//     console.log("lenght1");
//   } else if (clickedAppIds.length === 4) {
//     const placeholders = Array.from(
//       { length: 5 },
//       (_, index) => `placeholder_${index}`
//     );
//     localStorage.setItem(
//       "clickedAppIds",
//       JSON.stringify(clickedAppIds.concat(placeholders))
//     );
//     console.log("lenght5");
//   }
//   else if (clickedAppIds.length === 5) {
//     const placeholders = Array.from(
//       { length: 5 },
//       (_, index) => `placeholder_${index}`
//     );
//     localStorage.setItem(
//       "clickedAppIds",
//       JSON.stringify(clickedAppIds.concat(placeholders))
//     );
//     console.log("lenght5");
//   } else if (clickedAppIds.length === 7){
//     const placeholders = Array.from(
//       { length: 5 },
//       (_, index) => `placeholder_${index}`
//     );
//     localStorage.setItem(
//       "clickedAppIds",
//       JSON.stringify(clickedAppIds.concat(placeholders))
//     );
//   }
// }
// }
// checkLength()
// function removeConsecutivePlaceholders() {
//   const clickedAppIds = JSON.parse(localStorage.getItem("clickedAppIds"));

//   if (!clickedAppIds || clickedAppIds.length === 0) {
//     // No data or empty array, nothing to process
//     return;
//   }

//   const placeholderThreshold = 6;

//   let consecutivePlaceholdersCount = 0;
//   let updatedClickedAppIds = [];

//   // Loop through the array
//   for (const id of clickedAppIds) {
//     if (id === undefined || id.startsWith("placeholder")) {
//       // If the current ID is undefined or a placeholder, increment the count
//       consecutivePlaceholdersCount++;
//     } else {
//       // If the current ID is not undefined or a placeholder, reset the count
//       consecutivePlaceholdersCount = 0;
//     }

//     // Add the current ID to the updated array
//     if (id !== undefined) {
//       updatedClickedAppIds.push(id);
//     }

//     // Check if we have reached the threshold of consecutive placeholders
//     if (consecutivePlaceholdersCount === placeholderThreshold) {
//       // Remove the last 6 placeholders in the sequence
//       updatedClickedAppIds = updatedClickedAppIds.slice(0, -6);

//       // Reset the count to 0 after removing placeholders
//       consecutivePlaceholdersCount = 0;
//     }
//   }

//   // Save the updated array back to local storage
//   localStorage.setItem("clickedAppIds", JSON.stringify(updatedClickedAppIds));
// }


// function getSavedClickedApps() {
//   var savedAppIds = localStorage.getItem("clickedAppIds");
//   return savedAppIds ? JSON.parse(savedAppIds) : [];
// }
// // document.addEventListener('contextmenu', function (event) {
// // // Prevent the default context menu
// // event.preventDefault();
// // });

// let deferredPrompt;

// window.addEventListener("beforeinstallprompt", (event) => {
//   // Prevent the default browser prompt
//   event.preventDefault();

//   // Stash the event so it can be triggered later
//   deferredPrompt = event;

//   // Show your custom install button or popup
//   showInstallPrompt();
// });

// function showInstallPrompt() {
//   const modal = document.getElementById("installPromptModal");
//   modal.style.display = "block";

//   const installButton = document.getElementById("installButton");
//   const dismissButton = document.getElementById("dismissButton");

//   // Event listener for the "Install" button
//   installButton.addEventListener("click", () => {
//     // Trigger the installation prompt
//     triggerInstallPrompt();
//     modal.style.display = "none";
//   });

//   // Event listener for the "Dismiss" button
//   dismissButton.addEventListener("click", () => {
//     modal.style.display = "none";
//   });
// }

// // You can call this function when the user clicks the install button
// function triggerInstallPrompt() {
//   if (deferredPrompt) {
//     // Show the installation prompt
//     deferredPrompt.prompt();

//     // Wait for the user to respond to the prompt
//     deferredPrompt.userChoice.then((choiceResult) => {
//       if (choiceResult.outcome === "accepted") {
//         console.log("User accepted the installation prompt");
//       } else {
//         console.log("User dismissed the installation prompt");
//       }

//       // Clear the deferredPrompt variable
//       deferredPrompt = null;
//     });
//   }
// }


// function handleDeleteClick() {
//   // Get all div elements with the class "icon"
//   const iconElements = document.querySelectorAll(".icon");

//   // Iterate over each icon element
//   iconElements.forEach(function (iconElement, index) {
//       // Check if the icon element has an ID containing "placeholder_"
//       if (!iconElement.id.includes("placeholder_")) {
//           // Check if the delete button already exists
//           const deleteButton = iconElement.querySelector(".delete-button");

//           if (deleteButton) {
//               // If the delete button exists, toggle its visibility
//               deleteButton.style.display =
//                   deleteButton.style.display === "none" ? "block" : "none";
//           } else {
//               // If the delete button does not exist, create and append it
//               const deleteButton = document.createElement("button");
//               deleteButton.textContent = "-";
//               deleteButton.classList.add("delete-button");
//               deleteButton.addEventListener("click", function () {
//                   // Get the parent ID
//                   const parentId = iconElement.id;

//                   // Remove the parent ID from local storage
//                   const savedAppIds =
//                       JSON.parse(localStorage.getItem("clickedAppIds")) || [];
//                   const parentIndex = savedAppIds.indexOf(parentId);
//                   if (parentIndex !== -1) {
//                       savedAppIds.splice(parentIndex, 1);
//                       localStorage.setItem("clickedAppIds", JSON.stringify(savedAppIds));
//                   }

//                   // Generate a new placeholder ID that doesn't exist in the savedAppIds array
//                   const placeholderId = `placeholder_${parentIndex}`;

//                   // Replace the app ID with the placeholder ID in local storage
//                   savedAppIds.splice(parentIndex, 0, placeholderId);

//                   localStorage.setItem("clickedAppIds", JSON.stringify(savedAppIds));

//                   // Remove the iconElement from the DOM
//                   iconElement.remove();
//                   window.location.reload();
//               });
//               // Append the delete button to the icon element
//               iconElement.appendChild(deleteButton);
//           }
//       }
//   });
// }


// // ******************************************************------------***********************

// async function fetchGazData() {
//   const maxRetries = 5;
//   const baseDelay = 1000; // Initial delay between retries in milliseconds
//   let delay = baseDelay;
//   let retries = 0;

//   while (retries < maxRetries) {
//     try {
//       const tokenResponse = await fetch("/ApiAfficheurdynimac/getToken");
//       const tokenData = await tokenResponse.json();
//       const myHeaders = new Headers();
//       const today = new Date();
//       myHeaders.append("Content-Type", "application/x-ndjson");
//       myHeaders.append("Authorization", `Bearer ${tokenData.access_token}`);

//       // Calculate start and end dates for the last month
//       const lastMonth = new Date();
//       lastMonth.setMonth(lastMonth.getMonth() - 1);
//       const start = `${lastMonth.getFullYear()}-${(lastMonth.getMonth() + 1)
//         .toString()
//         .padStart(2, "0")}-01`;
//       const end = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0)
//         .toISOString()
//         .split("T")[0];

//       const requestOptions = {
//         method: "GET",
//         headers: myHeaders,
//         redirect: "follow",
//       };

//       const response = await fetch(
//         `https://api.grdf.fr/adict/v2/pce/02100144637829/donnees_consos_publiees?date_debut=${start}&date_fin=${end}`,
//         requestOptions
//       );

//       if (response.status === 200) {
//         const result = await response.json();
//         console.log(result);
      
//         const consumptionValue = result.consommation !== null ? result.consommation.volume_brut : undefined;
//         return consumptionValue;
//       } else if (response.status === 429) {
//         // Retry after delay
//         await new Promise((resolve) => setTimeout(resolve, delay));
//         delay *= 2; // Exponential backoff: double the delay for each retry
//         retries++;
//       } else {
//         // Handle other non-successful response codes
//         throw new Error(`Request failed with status ${response.status}`);
//       }
//     } catch (error) {
//       console.error(error);
//       throw error; // Rethrow the error to be handled outside the function
//     }
//   }

//   throw new Error(`Maximum number of retries (${maxRetries}) exceeded.`);
// }
// // fetchGazData();

// async function energyDataAsync() {
//   try {
//     const response = await fetch("/ApiAfficheurdynimac/energy");
//     const data = await response.json();

//     if (data.data && data.data.length > 0) {
//       const energyData = data.data;
//       const latestEnergyData = energyData[energyData.length - 1];
//       const secondLatestEnergyData = energyData[energyData.length - 2];

//       const latestKwh = latestEnergyData.kwh;
//       const secondLatestKwh = secondLatestEnergyData.kwh;



//       return [latestKwh, secondLatestKwh];
//     } else {
//       console.log("The energyData array is empty.");
//       return [null, null];
//     }
//   } catch (error) {
//     console.error("Error fetching data:", error);
//     return null;
//   }
// }
// async function Collecteau() {
//   try {
//     const queryApi = new InfluxDB({
//       url: "https://influx.novatice.com",
//       token: "7g22yYxVUMzTH4DRjIVWbIABsjc5eWS7TGAVxtsSN0c5deRq3S5xnFQ0V455W4EgOFqHn164PZZ7QPCbo83lRg==",
//     }).getQueryApi("Novatice");

//     // Get the first day of the current month and format it as yyyy-mm-dd
//     const currentDate = new Date();
//     const firstDayOfCurrentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
//       .toISOString()
//       .slice(0, 10);

//     // Get the first day of the previous month and format it as yyyy-mm-dd
//     const prevMonth = new Date();
//     prevMonth.setMonth(prevMonth.getMonth() - 1);
//     prevMonth.setDate(1);
//     const firstDayOfPrevMonth = prevMonth.toISOString().slice(0, 10);

//     // Get the last day of the previous month and format it as yyyy-mm-dd
//     const lastDayOfPrevMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 0)
//       .toISOString()
//       .slice(0, 10);

//     // Get today's date and format it as yyyy-mm-dd
//     const today = new Date().toISOString().slice(0, 10);
//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     const yesterdayDate = yesterday.toISOString().slice(0, 10);
//     const fluxQueries = [
//       `from(bucket:"lorawan") |> range(start: ${firstDayOfPrevMonth}, stop: ${lastDayOfPrevMonth}) |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "Index0h00")  |> aggregateWindow(every: 30d, fn: last, createEmpty: false)`,
//       `from(bucket:"lorawan") |> range(start: ${firstDayOfCurrentMonth}, stop: ${today}) |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "Index0h00")  |> aggregateWindow(every: 30d, fn: last, createEmpty: false)`,
//       `
//       from(bucket:"lorawan")
//       |> range(start: -24h)
//       |> filter(fn: (r) => r._measurement == "HRL-c-G3" and r._field == "ForwardFlow_Last24Hours_Sum")
//       |> last()`
      
//     ];

//     const promises = fluxQueries.map(async (fluxQuery) => {
//       const data = await queryApi.collectRows(fluxQuery);
//       return data[data.length - 1]._value;
//     });

//     const [lastMonthData, currentMonthData, todayData] = await Promise.all(promises);
//     // console.log(lastMonthData, currentMonthData, todayData);
//     return { lastMonthData, currentMonthData, todayData };
//   } catch (error) {
//     console.error("Error in Collecteau:", error);
//     throw error;
//   }
// }
// // Collecteau()
// //////////////////////////////////////

// const queryApiMeteo = new InfluxDB({
//   url: "https://influx.novatice.com",
//   token:
//     "7g22yYxVUMzTH4DRjIVWbIABsjc5eWS7TGAVxtsSN0c5deRq3S5xnFQ0V455W4EgOFqHn164PZZ7QPCbo83lRg==",
// }).getQueryApi("Novatice");

// async function dataMeteo(EUI) {
//   // station meteo data requette
//   const fluxQuery = `from(bucket:"lorawan") |> range(start: today()) |> filter(fn: (r) => r._measurement == "S2120" and r.DeviceID == "${EUI}")`;

//   const data = await queryApiMeteo.collectRows(fluxQuery);
//   const array = [];
//   const elementIds = {
//     humidity: "#humidite .value",
//     uv_index: "#indice_uv .value",
//     wind_speed: "#vitesse_du_vent .value",
//     temperature: "#temperature .value",
//     pressure: "#pression .value",
//     illumination: "#luminosite .value",
//     wind_direction: "#direction_du_vent .value",
//     rain_gauge: "#precipitation .value",
//   };

//   data.forEach((value, index) => {
//     var data = {
//       name: value._field,
//       value: value._value,
//       time: value._time,
//     };
//     array.push(data);
//   });
//   var output = array.reduce(function (o, cur) {
//     // Get the index of the key-value pair.
//     var occurs = o.reduce(function (n, item, i) {
//       return item.name === cur.name ? i : n;
//     }, -1);

//     // If the name is found,
//     if (occurs >= 0) {
//       // append the current value to its list of values.
//       o[occurs].value = o[occurs].value.concat(cur.value);
//       o[occurs].time = o[occurs].time.concat(cur.time);
//     } else {
//       // add the current item to o.

//       var obj = {
//         name: cur.name,
//         value: [cur.value],
//         time: [cur.time],
//       };
//       o = o.concat([obj]);
//     }

//     return o;
//   }, []);
//   const lastValues = {};

//   output.forEach((item) => {
//     const elementId = elementIds[item.name];
//     if (elementId && item.value.length > 0) {
//       const lastValue = item.value[item.value.length - 1];
//       lastValues[item.name] = lastValue;
//     }
//   });
//   // console.log(lastValues);
//   return lastValues;
// }
// function getWindDirectionText(windDirection) {
//   if (windDirection >= 337.5 || windDirection < 22.5) {
//     return "Nord";
//   } else if (windDirection >= 22.5 && windDirection < 67.5) {
//     return "Nord-Est";
//   } else if (windDirection >= 67.5 && windDirection < 112.5) {
//     return "Est";
//   } else if (windDirection >= 112.5 && windDirection < 157.5) {
//     return "Sud-Est";
//   } else if (windDirection >= 157.5 && windDirection < 202.5) {
//     return "Sud";
//   } else if (windDirection >= 202.5 && windDirection < 247.5) {
//     return "Sud-Ouest";
//   } else if (windDirection >= 247.5 && windDirection < 292.5) {
//     return "Ouest";
//   } else {
//     return "Nord-Ouest";
//   }
// }
// async function getWeatherData() {
//   const url = `https://api.openweathermap.org/data/2.5/weather?q=Bois-Guillaume&appid=1fc26e02b94a0282e3bdac0f1ed41dd3&units=metric`;
  
//   try {
//     const response = await fetch(url);
//     const data = await response.json();
    
//     const { main, weather } = data;
//     const icon = `https://openweathermap.org/img/wn/${weather[0].icon}@2x.png`;
//     const temp = Math.round(main.temp);
//       console.log(icon);
//       console.log(temp);
//     return [icon, temp];
//   } catch (error) {
//     console.error("There was an error!", error);
//     return null;
//   }
// }
// ///////////////////////////////////MAP///////////////////////////////////////////////////////
// const queryApi = new InfluxDB({
//   url: "https://influx.novatice.com",
//   token:
//     "7g22yYxVUMzTH4DRjIVWbIABsjc5eWS7TGAVxtsSN0c5deRq3S5xnFQ0V455W4EgOFqHn164PZZ7QPCbo83lRg==",
// }).getQueryApi("Novatice");
// var total = 0;

// async function batimentData(EUI) {
//   try {
//     total = 0;

//     // Fetch data from MongoDB using the /sensors/:collectionName/last route
//     const response = await fetch(`/ApiAfficheurdynimac/sensors/${EUI}/last`);
//     const data = await response.json();

//     if (!data || data.length === 0) {
//       console.log(`No data found for collection: ${EUI}`);
//       return;
//     }

    

//     // Define card data
//     const cardData = {
//       humidity: {
//         symbol: " ppm",
//         name: "Composés organiques volatils",
//       },
//       co2: {
//         symbol: " ppm",
//         name: "CO2",
//         Normal: [0, 799],
//         Medium: [800, 1199],
//         Poor: [1200, 9000],
//       },
//       temperature: {
//         symbol: " °C",
//         name: "Température",
//       },
//     };

//     // console.log(data, "output");

//     data.forEach((indicateur) => {
//       for (const key in indicateur) {
//         if (key in cardData) {
//           switch (key) {
//             case "co2":
//               // console.log("co2");
//               let co2Value = +indicateur[key]; // Convert to number
//               total += co2Value;
//               break;
//               case "temperature":

//                 const htmlValueElement = document.querySelector(`.temp-value`);
//                 if (htmlValueElement) {
//                   htmlValueElement.innerHTML = `${indicateur[key]} <span class="petit"><img class="co2img" src="./img/tempimg.svg" /></span>`;
//                 }
//                 break;
//             case "humidity":
//               const htmlValueElementHumidity = document.querySelector(`.humidite-value`);
//               if (htmlValueElementHumidity) {
//                 htmlValueElementHumidity.innerHTML = `${indicateur[key]} <span class="petit"><img class="co2img" src="./img/humiditeimg.svg" /></span>`;
//               }
//             break;
//           }
//         }
//       }
//     });

//     // Handle co2 separately after calculating total
//     updateGauge({ name: "co2", value: total });

//   } catch (error) {
//     console.error('Error fetching data:', error);
//   }
// }
// setTimeout(() => {
//   batimentData("24e124725c378643");

// }, 3000);
// function updateGauge(indicateur) {
//   var opts = {
//     angle: 0,
//     lineWidth: 0.11,
//     radiusScale: 0.4,
//     pointer: {
//       length: 0.5,
//       strokeWidth: 0.02,
//       color: "#fff",
//     },
//     staticLabels: {
//       font: "10px sans-serif",
//       labels: [1, 2, 3, 4, 5],
//       fractionDigits: 0,
//       color: "#fff",
//     },
//     staticZones: [
//       { strokeStyle: "#00a710", min: 1, max: 2 },
//       { strokeStyle: "#00a710", min: 2, max: 3 },
//       { strokeStyle: "#f4ae00", min: 3, max: 4 },
//       { strokeStyle: "#f4ae00", min: 4, max: 5 },
//       { strokeStyle: "#fd3232", min: 5, max: 6 },
//     ],
//     limitMax: false,
//     limitMin: false,
//     highDpiSupport: true,
//   };
//   function resizeCanvas() {
//     var canvas = document.getElementById('foo');
//     var container = document.querySelector('.pic-indice');
  
//     // Assurez-vous que le ratio d'aspect du contenu du canevas est préservé
//     canvas.width = container.offsetWidth;
//     canvas.height = container.offsetHeight;
//   }
  
//   // Appelez cette fonction au chargement de la page et chaque fois que la fenêtre est redimensionnée
//   window.addEventListener('load', resizeCanvas);
//   window.addEventListener('resize', resizeCanvas);
  
//   let target = document.getElementById("foo");
//   let gauge = null;
//   if (target) {
//     gauge = new Gauge(target).setOptions(opts);
//     gauge.minValue = 1;
//     gauge.maxValue = 6;
//   }

//   let target2 = document.getElementById("foo2");
//   let gauge2 = null;
//   if (target2) {
//     gauge2 = new Gauge(target2).setOptions(opts);
//     gauge2.minValue = 1;
//     gauge2.maxValue = 6;
//   }

//   let bienEtreElement = null;
//   let bienEtreElement_ = null;
//   let bienEtreElementR = null;
//   let statusCarreaux = null;

//   if (gauge) {
//     bienEtreElement = document.getElementById("etat-indice");
//     bienEtreElement_ = document.getElementById("etat-indice_");
//   }

//   if (gauge2) {
//     bienEtreElementR = document.querySelector(".statut-indice p");
//   }
//    let app1 =  document.getElementById("app1")
//    if (app1) {
//     statusCarreaux = document.querySelector(".text-des span")
//    }
//   switch (indicateur.name) {
//     case "co2":
//       const htmlvalueco2 = document.querySelectorAll(".oxy-value");
//       htmlvalueco2.forEach((element) => {
//         element.innerHTML =
//           indicateur.value + ' <span class="petit"><img class="co2img" src="./img/co2img.svg" /></span>';
//       });
//       let co2Value = +indicateur.value;
//       if (co2Value >= 0 && co2Value <= 400) {
//         if (gauge) {
//           gauge.set(1); // Très bon
//           bienEtreElement.innerHTML = "Très bien";
//           bienEtreElement_.innerHTML = "Très bien";
     
//         }
//         if (gauge2) {
//           gauge2.set(1); // Très bon
//           bienEtreElementR.innerHTML = "Très bien";
//         }
//         if (app1 && statusCarreaux) {
//           statusCarreaux.innerHTML = "Très bien";
//           statusCarreaux.classList.add("vert")
//         }
//       } else if (co2Value >= 401 && co2Value <= 800) {
//         if (gauge) {
//           gauge.set(2); // Bon
//           bienEtreElement.innerHTML = "Bon";
//           bienEtreElement_.innerHTML = "Bon";
         
//         }
//         if (gauge2) {
//           gauge2.set(2); // Bon
//           bienEtreElementR.innerHTML = "Bon";
//         }
//         if (app1 && statusCarreaux) {
//           statusCarreaux.innerHTML = "Bon";
//           statusCarreaux.classList.add("vert")
//         }
//       } else if (co2Value >= 801 && co2Value <= 1200) {
//         if (gauge) {
//           gauge.set(3); // Moyen
//           bienEtreElement.innerHTML = "Moyen";
//           bienEtreElement_.innerHTML = "Moyen";
//           statusCarreaux.innerHTML = "Moyen";
//           statusCarreaux.classList.add("orange")
//         }
//         if (gauge2) {
//           gauge2.set(3); // Bon
//           bienEtreElementR.innerHTML = "Moyen";
//         }
//         if (app1 && statusCarreaux) {
//           statusCarreaux.innerHTML = "Moyen";
//           statusCarreaux.classList.add("orange")
//         }
//       } else if (co2Value >= 1201 && co2Value <= 1600) {
//         if (gauge) {
//           gauge.set(4); // Médiocre
//           bienEtreElement.innerHTML = "Médiocre";
//           bienEtreElement_.innerHTML = "Médiocre";
          
//         }
//         if (gauge2) {
//           gauge2.set(4); // Bon
//           bienEtreElementR.innerHTML = "Médiocre";
//         }
//         if (app1 && statusCarreaux) {
//           statusCarreaux.innerHTML = "Médiocre";
//           statusCarreaux.classList.add("orange")
//         }
//       } else {
//         if (gauge) {
//           gauge.set(5); // Mauvais
//           bienEtreElement.innerHTML = "Mauvais";
//           bienEtreElement_.innerHTML = "Mauvais";
    
//         }
//         if (gauge2) {
//           gauge2.set(5); // Bon
//           bienEtreElementR.innerHTML = "Mauvais";
//         }
//         if (app1 && statusCarreaux) {
//           statusCarreaux.innerHTML = "Mauvais";
//           statusCarreaux.classList.add("rouge")
//         }
//       }

//       break;
     
//   }
// }

// ///////////////////////////////
// async function fetchLastImageFilename() {
//   const apiUrl = "/apiSerre/pictures";

//   try {
//     // Fetch the image filenames from the server
//     const response = await fetch(apiUrl);

//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     // Parse the response JSON
//     const data = await response.json();

//     // Get the last filename
//     const lastFilename = data[data.length - 1];
//     console.log("Last Filename:", lastFilename);

//     // Return the last filename or use it as needed
//     return lastFilename;
//   } catch (error) {
//     console.error("Error fetching image filenames:", error);
//     // Handle the error here
//     throw error; // Rethrow the error if necessary
//   }
// }
// ////////////////
// async function fetchLastMqttData(deviceId) {
//   try {
//     const response = await fetch(`/apiSerre/dataMQTT/${deviceId}`);
//     if (!response.ok) {
//       throw new Error(`HTTP error! Status: ${response.status}`);
//     }

//     const data = await response.json();

//     // Assuming the data is organized by device ID, get the last entry for the specified device
//     const lastEntry = data[deviceId] ? data[deviceId][0] : null;

//     if (lastEntry) {
//       // Parse the "value" field from string to object
//       const parsedValue = JSON.parse(lastEntry.data.value);

//       // Extract "cloud" field and convert it to an array
//       const cloudArray = parsedValue.cloud.slice(1, -1).split(",").map(Number);

//       // Replace the original string value with the array
//       parsedValue.cloud = cloudArray;

//       // Replace the original "value" field with the updated object
//       lastEntry.data.value = parsedValue;
//     }

//     return lastEntry;
//   } catch (error) {
//     console.error("Error fetching MQTT data:", error);
//     throw error; // You may want to handle this error appropriately in your application
//   }
// }
// ////////////////////////////////////////////////////
// let serreID = localStorage.getItem('data-id');

// async function fetchAndFilterProjects() {
//   try {
//     // Fetch serre data from your Express API
//     const response = await fetch(`/apiSerreMobile/serreMobile/${serreID}`);
//     console.log(response);

//     if (!response.ok) {
//       throw new Error('Failed to fetch serre data');
//     }

//     const serre = await response.json();
//     console.log(serre);

//     // Get today's date in ISO format
//     const today = new Date().toISOString();

//     function parseAndConvertToDateISO(dateString) {
//       // Define an array of possible date formats
//       const dateFormats = ["YYYY-MM-DD", "DD-MM-YYYY", "YYYY/MM/DD", "DD/MM/YYYY"];
      
//       // Initialize a variable to store the parsed date
//       let parsedDate = null;
      
//       // Iterate through the date formats and try to parse the date
//       for (const format of dateFormats) {
//         const parsedDateAttempt = new Date(moment(dateString, format).format());
      
//         if (!isNaN(parsedDateAttempt)) {
//           // If the parsed date is not NaN, it's a valid date
//           parsedDate = parsedDateAttempt;
//           break;
//         }
//       }
      
//       // If a valid date was found, convert it to ISO format
//       if (parsedDate) {
//         return parsedDate.toISOString();
//       }
      
//       return null; // Return null if the date couldn't be parsed
//     }
      
//     // Filter the projects array based on the date range
//     const filteredProjects = serre.projects.filter((project) => {
//       const projectStartDate = parseAndConvertToDateISO(project.dateStart);
//       const projectEndDate = parseAndConvertToDateISO(project.dateEnd);
//       return projectStartDate <= today && projectEndDate >= today;
//     });

//     // Check if filteredProjects array is not empty and has a valid project name
//     if (filteredProjects.length > 0 && filteredProjects[0].nom) {
//       return filteredProjects[0].nom;
//     } else {
//       return "Pas d'expérience"; // Return an empty string if no valid project name is found
//     }

//   } catch (error) {
//     console.error('Error:', error);
//     return ""; // Return an empty string in case of an error
//   }
// }


// /////////////////////////////////////////////////
// async function batimentData2(EUI) {
//   try {
//     // Fetch data from MongoDB using the /sensors/:collectionName/last route
//     const response = await fetch(`/ApiAfficheurdynimac/sensors/${EUI}/last`);
//     const data = await response.json();

//     if (!data || data.length === 0) {
//       console.log(`No data found for collection: ${EUI}`);
//       return null;
//     }

//     // Extracting relevant data from the response
//     const { temperature, humidity, co2, battery, time } = data[0];

//     // Constructing an object with the extracted data
//     const sensorData = {
//       temperature: temperature,
//       humidity: humidity,
//       co2: co2,
//       battery: battery,
//       time: time
//     };

//     return sensorData;
//   } catch (error) {
//     console.error('Error fetching sensor data:', error);
//     throw error;
//   }
// }
// const fetchDevices = async () => {
//   const system = 'ANDROID';
//   const type = 'TABLET'; // You can omit this line if you want devices of any type
//   const groupName = 'Showroom';
//   let sumIndex = 0; // Initialize the sum of indices to 1

//   try {
//       const response = await fetch('/ApiAfficheurdynimac/graphql', {
//           method: 'POST',
//           headers: {
//               'Content-Type': 'application/json',
//           },
//           body: JSON.stringify({
//               system,
//               type,
//               groupName
//           }),
//       });

//       if (response.ok) {
//           const data = await response.json();
//           console.log(data); // Log the data received from the GraphQL response

//           // Check if the data contains getDevices items
//           if (data && data.data && data.data.getDevices && data.data.getDevices.items) {
//               const devices = data.data.getDevices.items;
//               // Iterate over the devices and sum their indices starting from 1
//               devices.forEach((device, index) => {
//                   sumIndex += index;
//               });
//           }

//           return sumIndex; // Return the sum of indices
//       } else {
//           console.error('GraphQL request failed');
//           return sumIndex; // Return 1 if request failed
//       }
//   } catch (error) {
//       console.error('Request error:', error);
//       return sumIndex; // Return 1 in case of error
//   }
// };

// // ////////////////////////////////////////////////////////////////
// document.addEventListener('gesturestart', function (e) {
//   e.preventDefault();
// });
// document.getElementById('deletecach').addEventListener('click', function() {
//   // Supprimer l'élément "clickedAppIds" du localStorage
//   localStorage.removeItem('clickedAppIds');
//   window.location.reload()
// });
// //////////////////

// // Function to subscribe to push notifications
// async function subscribeToPushNotifications() {
//   try {
//       const registration = await navigator.serviceWorker.register('./service-worker.js');
//       console.log('Service Worker registered');

//       const publicVapidKey = "BHwvGFW4j3IrzfRPYSjshLUtUT6t_MejwvWGBjD3FhKaXeKSrp9uWVhKbqmsuRrAjkuhddrHHGoXnLgh-jk3KdY";

//       const subscription = await registration.pushManager.subscribe({
//           userVisibleOnly: true,
//           applicationServerKey: urlBase64ToUint8Array(publicVapidKey)
//       });

//       await fetch('/ApiAfficheurdynimac/subscribe', {
//           method: 'POST',
//           body: JSON.stringify(subscription),
//           headers: {
//               'Content-Type': 'application/json'
//           }
//       });

//       console.log('Subscribed to push notifications');
//   } catch (error) {
//       console.error('Error subscribing to push notifications:', error);
//   }
// }

// // Utility function to convert base64 string to Uint8Array
// function urlBase64ToUint8Array(base64String) {
//   const padding = '='.repeat((4 - base64String.length % 4) % 4);
//   const base64 = (base64String + padding)
//       .replace(/\-/g, '+')
//       .replace(/_/g, '/');

//   const rawData = window.atob(base64);
//   const outputArray = new Uint8Array(rawData.length);

//   for (let i = 0; i < rawData.length; ++i) {
//       outputArray[i] = rawData.charCodeAt(i);
//   }
//   return outputArray;
// }

// // Subscribe to push notifications when the page loads
// window.onload = subscribeToPushNotifications;
// /////////////////////////
