<template>
    <div v-if="apiResponseHasData">
        <div class="is-flex is-flex-direction-row is-justify-content-space-between mb-4">
            <div>
                <button class="button is-small is-info" @click="toggleTree">
                    {{treeControlLabel}}
                </button>
            </div>
            <div>
                <button @click="downloadXml" class="button is-small is-warning">
                    <span class="icon">
                        <i class="fa fa-download"></i>
                    </span>
                    <span>Download package.xml</span>
                </button>
                <button @click="copyFile('excel')" class="button is-small is-warning ml-3">
                    <span class="icon">
                        <i class="fa fa-copy"></i>
                    </span>
                    <span>Copy (Excel)</span>
                </button>
                <button @click="copyFile('csv')" class="button is-small is-warning ml-3">
                    <span class="icon">
                        <i class="fa fa-copy"></i>
                    </span>
                    <span>Copy (csv)</span>
                </button>
            </div>
        </div>

        <div class="notification is-warning is-light">
            <span v-html="resultsDescription"></span>
        </div>
        <div class="canvas-container mt-5 mb-4 ml-3">
            <canvas ref="stats"></canvas>
        </div>
        <MetadataTree :metadata="metadataTree" :parent-open="openTree"/> 
    </div>
    <div v-else>
        <div class="notification is-warning is-light">
            <span v-html="noResultsDescription"></span>
        </div>
    </div>
     
</template>

<script>

import MetadataTree from '@/components/MetadataTree.vue';

export default {

    components:{MetadataTree},

    props:['metadataTree','apiResponse'],

    data(){
        return{
            openTree:false,
            barChart:undefined
        }
    },

    mounted(){
        this.displayStats(this.apiResponse.stats,'usage');
    },

    watch: {
        
        apiResponse: function (newValue, oldValue) {
            this.displayStats(newValue.stats,'usage');
        }
    },

    methods:{
        toggleTree(){
            this.openTree = !this.openTree;
        },

        downloadXml(){

            let hiddenLink = document.createElement('a');
            hiddenLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(this.apiResponse.packageXml));
            hiddenLink.setAttribute('download', `${this.apiResponse.entryPoint.name}-package.xml`);            
            hiddenLink.style.display = 'none';

            document.body.appendChild(hiddenLink);
            hiddenLink.click();
            document.body.removeChild(hiddenLink); 
        },

        copyFile(type){

            if (document.queryCommandSupported && document.queryCommandSupported('copy')) {
                var textarea = document.createElement('textarea');
                textarea.textContent = this.apiResponse[type];
                textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in Microsoft Edge.
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    return document.execCommand("copy");  // Security exception may be thrown by some browsers.
                }
                catch (ex) {
                    console.warn("Copy to clipboard failed.", ex);
                    return false;
                }
                finally {
                    document.body.removeChild(textarea);
                }
            }
        },

        displayStats(stats,type){

            //remove the contents of the previously initialized chart
            if(this.barChart){
                this.barChart.destroy();
            }

            let availableBackgroundColors = [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ];
            let chartLabels = [];
            let chartValues = [];

            for (const key in stats) {
                chartLabels.push(key);
                chartValues.push(stats[key]);
            }

            let backgroundColors = [];

            chartLabels.forEach(val => {
                let randomValue = availableBackgroundColors[Math.floor(Math.random() * availableBackgroundColors.length)]; 
                backgroundColors.push(randomValue);
            })

            let canvas = this.$refs.stats;

            if(!canvas) return;

            let ctx = canvas.getContext('2d');

            let label = (type === 'usage' ? '# of Metadata Types using it' : '# of Metadata Types required for deployment');

            this.barChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: label,
                        data: chartValues,
                        backgroundColor: backgroundColors,
                        borderWidth: 2
                    }]
                },
                options: {
                    maintainAspectRatio: false,
                    scales: {
                        yAxes: [{
                            ticks: {
                                beginAtZero: true
                            }
                        }]
                    }
                }
            }); 
        }
    },

    computed:{
        treeControlLabel(){
            return this.openTree ? 'Collapse All' : 'Expand All';
        },

        apiResponseHasData(){
            return this.apiResponse && Object.keys(this.apiResponse.stats).length != 0;
        },

        resultsDescription(){

            let isUsage = this.apiResponse.hasOwnProperty('usageTree');
            let {type,name} = this.apiResponse.entryPoint;
            let stats = this.apiResponse.stats;

            let total = 0;

            for(const prop in stats){
                //we exclude reports from usage data because they are less important when
                //determining the overal impact
                if(prop != 'Report'){
                    total += stats[prop];
                }
            }

            let text = `The ${type} ${name} `;

            if(isUsage){
                text += `is being used by <b>${total} metadata items</b> (reports excluded). Changes to the ${type} <b>can impact these items</b>`
            }
            else{
                text += `depends <b>${total} metadata items</b>. All the metadata items below represent <b>what is needed to deploy this
                component to an empty org (like a scratch org)</b>`
            }

            return text;
        },

        noResultsDescription(){

            let isUsage = this.apiResponse.hasOwnProperty('usageTree');
            let {type,name} = this.apiResponse.entryPoint;
            let text;

            if(isUsage){
                text = `Unable to find any metadata items that use or reference the <b>${type} ${name}</b>. This either means that the ${type} is not being used at all or that it is used by
                metadata types that are <b>not yet supported by HappySoup</b>.`
            }else{
                text = `Unable to find any metadata items that the <b>${type} ${name}</b> depends on. This either means that the ${type} is a stand alone component (and can be deployed as is)
                or that it depends on metadata types that is <b>not yet supported by HappySoup</b>.`;
            }

            text += `If you think this is the case 
                please log a <i class="fab fa-github"></i> Github issue <a href="https://github.com/pgonzaleznetwork/sfdc-happy-soup/issues" target="_blank">here</a>`;
            

            return text;
        }
    }

}
</script>

<style>


    .canvas-container{
        width:800px;
        height:400px;
        position:relative;
    }

    canvas{
        background-color:white;
    }

</style>