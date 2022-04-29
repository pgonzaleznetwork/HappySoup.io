<template>

  <div class="is-flex is-flex-direction-row is-justify-content-flex-end mb-4">

        <button  v-if="!hideXml" @click="xml" class="button is-small ">
            <span class="icon xml">
                <i class="fa fa-download"></i>
            </span>
            <span class="font-weight-500">Download package.xml</span>
        </button>

        <button  v-if="!hideExcel" @click="excel" class="button is-small ml-3">
            <span class="icon" style="color:green">
                <i class="fas fa-file-excel"></i>
            </span>
            <span class="font-weight-500">Copy (Excel)</span>
        </button>

        <button  v-if="!hideCsv" @click="csv" class="button is-small ml-3">
            <span class="icon">
                <i class="fas fa-file-csv"></i>
            </span>
            <span class="font-weight-500">Copy (csv)</span>
        </button>
    </div>
</template>

<script>
export default {

    props:['hideXml','hideCsv','hideExcel'],

    methods:{

        xml(){
            this.$emit('xml');
        },

        csv(){
            this.$emit('csv');
        },

        excel(){
            this.$emit('excel');
        }

    }

}
</script>

<style lang="scss" scoped>

    .xml{
        color: $folder-color;
    }


</style>