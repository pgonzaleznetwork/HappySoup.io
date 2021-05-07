<template>
    <div class="field">
        <div class="control">
            <button class="button is-info">
            <span class="icon">
                <i class="fas fa-search"></i>
            </span>
            <span>{{title}}</span>
            </button>
        </div>
    </div>
</template>

<script>
export default {
    props:['title']
}
</script>

<style>

</style>