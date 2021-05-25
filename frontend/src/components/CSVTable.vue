<template>
  <div class="csvTable"></div>
</template>

<script>
export default {

    props:['csv'],

    watch: {
        csv: function (newValue, oldValue) {
            console.log('watched')
        }
    },

    async mounted(){

        console.log('table mounted')

        let data = await d3.text(this.csv);

        console.log('inside d3')

        var parsedCSV = d3.csvParse(data);

        console.log(parsedCSV)

        var container = d3.select('.csvTable')
            .append("table")

            .selectAll("tr")
                .data(parsedCSV).enter()
                .append("tr")

            .selectAll("td")
                .data(function(d) { return d; }).enter()
                .append("td")
                .text(function(d) { return d; });
        
    }

}
</script>

<style>

</style>


