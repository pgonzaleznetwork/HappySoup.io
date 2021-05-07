<template>
    <div class="field">
        <div class="control">
            <label class="checkbox">
            <input type="checkbox">
            {{name}} <span class="has-tooltip-arrow has-tooltip-info has-tooltip-right" :data-tooltip="content"><i class="far fa-question-circle"></i></span>
            </label>
        </div>
    </div>
</template>

<script>
export default {

    props:['name','content']

}
</script>

<style>

</style>