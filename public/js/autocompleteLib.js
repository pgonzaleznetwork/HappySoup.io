import {utils} from './utils.js'
import {byId} from './utils.js'

//example from W3 schools
function autocomplete(inputElement, items) {
    /*the autocomplete function takes two arguments,
      the text field element and an array of possible autocompleted values:*/
    let currentFocus = -1;

    let debouncedFilterItems = debounce(filterItems,250);
    let listener = debouncedFilterItems.bind(inputElement,items,currentFocus)

    inputElement.addEventListener('input',listener);

    
    /*execute a function presses a key on the keyboard:*/
    inputElement.addEventListener("keydown", function (e) {
      var x = byId(this.id + "autocomplete-list");
      if (x) x = x.getElementsByTagName("div");
      if (e.keyCode == 40) {
        /*If the arrow DOWN key is pressed,
            increase the currentFocus variable:*/
        currentFocus++;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 38) {
        //up
        /*If the arrow UP key is pressed,
            decrease the currentFocus variable:*/
        currentFocus--;
        /*and and make the current item more visible:*/
        addActive(x);
      } else if (e.keyCode == 13) {
        /*If the ENTER key is pressed, prevent the form from being submitted,*/
        e.preventDefault();
        if (currentFocus > -1) {
          /*and simulate a click on the "active" item:*/
          if (x) x[currentFocus].click();
        }
      }
    });
    function addActive(x) {
      /*a function to classify an item as "active":*/
      if (!x) return false;
      /*start by removing the "active" class on all items:*/
      removeActive(x);
      if (currentFocus >= x.length) currentFocus = 0;
      if (currentFocus < 0) currentFocus = x.length - 1;
      /*add class "autocomplete-active":*/
      x[currentFocus].classList.add("autocomplete-active");
    }
    function removeActive(x) {
      /*a function to remove the "active" class from all autocomplete items:*/
      for (var i = 0; i < x.length; i++) {
        x[i].classList.remove("autocomplete-active");
      }
    }
    
    /*execute a function when someone clicks in the document:*/
    document.addEventListener("click", function (e) {
      closeAllLists(e.target,inputElement);
    });
  }

  function closeAllLists(elmnt,inp) {
    /*close all autocomplete lists in the document,
      except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

function filterItems(items,currentFocus) {

  let searchTerm = this.value;
  let parentThis = this;

  var a,
    b,
    i,
    val = this.value;
  /*close any already open lists of autocompleted values*/
  closeAllLists(null,this);
  if (!searchTerm) {
    return false;
  }
  currentFocus = -1;

  /*create a DIV element that will contain the items (values):*/
  let autoCompleteList = document.createElement("DIV");
  autoCompleteList.setAttribute("id", this.id + "autocomplete-list");
  autoCompleteList.classList.add('autocomplete-items');

  /*append the DIV element as a child of the autocomplete container:*/
  this.parentNode.appendChild(autoCompleteList);

  /*for each item in the array...*/
  for (i = 0; i < items.length; i++) {
    /*check if the item starts with the same letters as the text field value:*/
    
    //items[i].substr(0, searchTerm.length).toUpperCase() == searchTerm.toUpperCase()
    if (items[i].toUpperCase().includes(searchTerm.toUpperCase())) {
      /*create a DIV element for each matching element:*/
      b = document.createElement("DIV");
      /*make the matching letters bold:*/
      b.innerHTML =
        "<span>" +
        items[i].substr(0, searchTerm.length) +
        "</span>";
      b.innerHTML += items[i].substr(searchTerm.length);
      /*insert a input field that will hold the current array item's value:*/
      b.innerHTML +=
        "<input id='selectedMember' type='hidden' value='" + items[i] + "'>";
      /*execute a function when someone clicks on the item value (DIV element):*/
      b.addEventListener("click", function (e) {
        /*insert the value for the autocomplete text field:*/
        parentThis.value = this.getElementsByTagName("input")[0].value;
        /*close the list of autocompleted values,
        (or any other open lists of autocompleted values:*/
        closeAllLists();
        utils.enableButton(byId('search-button'));
      });
      autoCompleteList.appendChild(b);
    }
  }
}

function debounce(func, wait, immediate) {
  var timeout;
  return function() {
    var context = this, args = arguments;
    var later = function() {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
}

export const autocompleteApi = {autocomplete};

