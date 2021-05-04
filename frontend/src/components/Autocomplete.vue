<template>
  <div class="vue3-autocomplete-container">
    <input
        ref="autocompleteRef"
        type="text"
        v-model="searchText"
        :class="getInputClass"
        @focus="displayResults"
        @blur="hideResults"
        @keydown.enter = 'enter'
        @keydown.down = 'down'
        @keydown.up = 'up'
        @input="handleInput"
    />
    <div :style="{ width: inputWidth + 'px' }" :class="getResultsContainerClass" v-if="shouldShowResults">
      <div
          v-for="(item,index) in filteredResults"
            :key="item"
            class="vue3-results-item"
            :class="{'active': isActive(index)}"
            @click="clickItem(item)"
           
            @mousedown.prevent
      >{{ displayItem(item) }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { ref, computed, SetupContext, onMounted } from 'vue'

export default {
  name: 'Autocomplete',
  props: {
    debounce: {
      type: Number,
      default: 0
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
    'input',
    'onSelect'
  ],
  setup(props, context) {
    const autocompleteRef = ref()
    let inputWidth = ref(0)
    let searchText = ref('')
    let timeout
    let showResults = ref(true)
    let current = ref(0);
    let results = ref([]);
    /**
     * Same as Vue2 'mounted' function, used to get refs correctly
     */
    onMounted(() => {
      inputWidth.value = autocompleteRef.value.offsetWidth - 2
    })
    /**
     * Triggered on input changes with a dynamic debounce
     * @param { InputEvent } e
     */
    function handleInput(e) {
      clearTimeout(timeout)
      displayResults();
      timeout = setTimeout(() => {
        results.value = props.suggestions.filter(member => {
                return member.toLowerCase()
                .includes(searchText.value.toLowerCase())
        })
      }, props.debounce)
    }
    /**
     * Triggered on click on a result item
     */
    function clickItem(data) {
      context.emit('onSelect', data)
      showResults.value = false
      searchText.value = data;
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
        console.log('up event')
        if(current.value > 0) current.value--;
    }

    function down() {
        console.log('down event')
        if(current.value < results.value.length - 1) current.value++;
    }

    function enter() {
        searchText.value = results.value[current.value];
        hideResults();
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
      inputWidth,
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
    top: 27px;
    border: 1px solid black;
    z-index: 99;
    background: white;
  }
  .vue3-results-item {
    list-style-type: none;
    padding: 5px;
    border-bottom: 1px solid black;
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