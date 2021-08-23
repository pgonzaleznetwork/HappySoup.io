<template>
  <div class="vue3-autocomplete-container">
    <input
        ref="autocompleteRef"
        type="text"
        v-model="searchText"
        class="input"
        :style="{ width: inputWidth  }"
        :disabled="disabled"
        @blur="hideResults"
        @keydown.enter = 'enter'
        @keydown.down.prevent = 'down'
        @keydown.up.prevent = 'up'
        @input="handleInput"
        autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
        placeholder="Type at least 3 characters..."
    />
    <div :style="{ width: inputWidth  }" :class="getResultsContainerClass" v-if="shouldShowResults">
      <div
          v-for="(item,index) in filteredResults"
            :key="item.name"
            class="vue3-results-item"
            :class="{'active': isActive(index)}"
            @click="clickItem(item)"
           
            @mousedown.prevent
      > <span v-html="item.label"></span> </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, SetupContext, onMounted, onUpdated } from 'vue'
import { useToast } from "primevue/usetoast";

export default {
  name: 'MultiSelectAutoComplete',
  props: {
    debounce: {
      type: String,
      default: 0
    },
    inputWidth:{
      type: String,
      default:'100%'
    },
    disabled:{
        type:Boolean,
        default:true
    },
    inputClass: {
      type: Array,
      default: []
    },
    max: {
      type: Number,
      default: 1000
    },
    suggestions: {
      type: Array,
      default: []
    },
    resultsContainerClass: {
      type: Array,
      default: []
    },
    resultsItemClass: {
      type: Array,
      default: []
    },
    displayItem: {
      type: Function,
      default: (item) => {

        return typeof item === 'string' ? item : item.name
      }
    }
  },
  emits: [
    'memberSelected','empty'
  ],
  setup(props, context) {
    const autocompleteRef = ref()
    const toast = useToast();
    let searchText = ref('')
    let timeout
    let showResults = ref(true)
    let current = ref(0);
    let results = ref([]);
    /**
     * Same as Vue2 'mounted' function, used to get refs correctly
     */
    onMounted(() => {
      
    })

    onUpdated(()=>{
      
    })
    /**
     * Triggered on input changes with a dynamic debounce
     * @param { InputEvent } e
     */
    function handleInput(e) {

        if(searchText.value.length < 3){
            hideResults();

          if(searchText.value.length == 0){
            context.emit('empty');
          }

            return;
        }

        clearTimeout(timeout)
        
        timeout = setTimeout(() => {

            results.value = [];
            current.value = 0;

            props.suggestions.forEach(member => {

                let {name,id} = member;

                let memberLc = name.toLowerCase();
                let textLc = searchText.value.toLowerCase();

                if(memberLc.includes(textLc)){
                    
                    let startIndex = memberLc.indexOf(textLc);

                    let textBeforeMatch = name.substr(0,startIndex);
                    let matchingText = name.substr(startIndex,searchText.value.length);
                    let textAfterMatch = name.substr(startIndex+searchText.value.length,member.length);

                    let result = {}

                    /*make the matching letters bold:*/
                    result.label = `${textBeforeMatch}<strong style=color:black;>${matchingText}</strong>${textAfterMatch}`;
                    result.name = name;
                    result.id = id;

                    results.value.push(result);
                }
            })

             if(results.value.length) {
               results.value.sort((a,b) =>{
                 return (a.name > b.name) ? 1 : -1
               });
               displayResults();
             }

        }, props.debounce)
    }
    
    /**
     * Called on focus
     */
    function displayResults() {
      showResults.value = true
    }
    /**
     * Called on blur
     */
    function hideResults() {
      showResults.value = false
    }

    function isActive(index){
        return index == current.value;
    }

    function up(){
        if(current.value > 0) {
          current.value--;
        }
        else if(current.value == 0){
          current.value = results.value.length - 1;
        }
    }

    function down() {
        if(current.value < results.value.length - 1) {
          current.value++;
        }
        else if(current.value == results.value.length - 1){
          current.value = 0;
        }
    }

    /**
     * Triggered on click on a result item
     */
    function clickItem(member) {
        context.emit('memberSelected', member)
        searchText.value = member.name;
        let style = 'background-color:#7ed6df';

        if(event.srcElement.nodeName == 'SPAN'){
            event.srcElement.parentElement.style = style;
        }
        else{
            event.srcElement.style = style;
        }

        
      
      
    }

    function enter() {
        context.emit('memberSelected', selectedMember)
        let selectedMember = results.value[current.value];
        searchText.value = selectedMember.name; 
        
    }

    /**
     * Return class(es) for input element
     */
    const getInputClass = computed(() => {
      return props.inputClass.length > 0 ? props.inputClass : ['vue3-input']
    })
    /**
     * Return class(es) for results container element
     */
    const getResultsContainerClass = computed(() => {
      return props.resultsContainerClass.length > 0 ?
          props.resultsContainerClass :
          ['vue3-results-container']
    })
    /**
     * Return class(es) for results item elements
     */
    const getResultsItemClass = computed(() => {
      return props.resultsItemClass.length > 0 ?
          props.resultsItemClass :
          ['vue3-results-item']
    })
    /**
     * Show results depending on results length and showResults boolean
     */
    let shouldShowResults = computed(() => {
      return showResults.value && (results.value.length > 0)
    })
    /**
     * Return results filtered with the 'max' props
     */
    const filteredResults = computed(() => {
      return results.value.slice(0, props.max)
    })

    

    /**
     * Return data, making them reactive
     */
    return {
      searchText,
      isActive,
      showResults,
      autocompleteRef,
      displayResults,
      hideResults,
      handleInput,
      clickItem,
      filteredResults,
      getInputClass,
      getResultsContainerClass,
      up,
      down,
      enter,
      getResultsItemClass,
      shouldShowResults
    }
  }
}
</script>

<style lang="scss" scoped>

.input{
  margin-bottom: 10px;
}

.input,.vue3-results-item{
  font-size: 13px;
}

.vue3-autocomplete-container {
  display: flex;
  flex-direction: column;
  .vue3-input {
    border-radius: 5px;
    &:focus {
      outline: none;
    }
  }
  .vue3-results-container {
    
    position: absolute;
    top: 45px;
    
    z-index: 99;
    background: white;
  }
  .vue3-results-item {
    list-style-type: none;
    padding: 5px;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    border: 1px solid #dbdbdb;
    border-radius: 4px;
    margin-bottom: 2px;

    &:hover {
      cursor: pointer;
    }
    &:nth-last-child(1) {
      border-bottom: none;
    }
  }

  .active{
      background-color: gainsboro
  }
}
</style>