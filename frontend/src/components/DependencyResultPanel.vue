<template>
    <div v-if="apiResponseHasData">

        <div class="notification is-warning is-light">
            <span v-html="resultsDescription"></span>
        </div>

        <div class="tabs is-boxed">
            <ul>
                <li :class="{'is-active':activeTab == 'tree'}">
                    <a @click.prevent="activateTab('tree')">
                        <span class="icon is-small"><i class="fas fa-sitemap" aria-hidden="true"></i></span>
                        <span>Tree View</span>
                    </a>
                </li>
                <li :class="{'is-active':activeTab == 'table'}">
                    <a @click.prevent="activateTab('table')">
                        <span class="icon is-small"><i class="fas fa-table" aria-hidden="true"></i></span>
                        <span>Table View</span>
                    </a>
                </li>
                <li :class="{'is-active':activeTab == 'chart'}">
                    <a @click.prevent="activateTab('chart')">
                        <span class="icon is-small"><i class="fas fa-chart-bar" aria-hidden="true"></i></span>
                        <span>Chart View</span>
                    </a>
                </li>
            </ul>
        </div>

        <div class="is-flex is-flex-direction-row is-justify-content-flex-end mb-4">
            <button @click="downloadXml(apiResponse)" class="button is-small ">
                <span class="icon" style="color:#f39c12;">
                    <i class="fa fa-download"></i>
                </span>
                <span style="font-weight:500;">Download package.xml</span>
            </button>
            <button @click="copyFile('excel',apiResponse)" class="button is-small  ml-3">
                <span class="icon" style="color:green">
                    <i class="fas fa-file-excel"></i>
                </span>
                <span  style="font-weight:500;">Copy (Excel)</span>
            </button>
            <button @click="copyFile('csv',apiResponse)" class="button is-small  ml-3">
                <span class="icon">
                    <i class="fas fa-file-csv"></i>
                </span>
                <span  style="font-weight:500;">Copy (csv)</span>
            </button>
        </div>

        <section v-show="activeTab == 'tree'">
            <div class="is-flex is-flex-direction-row is-justify-content-space-between mb-4">
                <div>
                    <button class="button is-small is-info" @click="toggleTree">
                        {{treeControlLabel}}
                    </button>
                </div>
                
            </div>

            <MetadataTree :metadata="metadataTree" :parent-open="openTree"/> 
            
        </section>

        <section v-show="activeTab == 'table'">
            <MetadataTable :source="apiResponse.datatable" />
        </section>

        <section  v-show="activeTab == 'chart'">
            <div class="canvas-container mt-5 mb-4 ml-3">
                <canvas ref="stats"></canvas>
            </div>
        </section>

    </div>
    <div v-else>
        <div class="notification is-warning is-light">
            <span v-html="noResultsDescription"></span>
        </div>
    </div>
     
</template>

<script>

import MetadataTree from '@/components/MetadataTree.vue';
import fileExports from '@/functions/fileExports'
import MetadataTable from '@/components/MetadataTable.vue'

export default {

    setup(){
      let {copyFile,downloadXml} = fileExports();
      return {copyFile,downloadXml};
    },

    components:{MetadataTree,MetadataTable},

    props:['metadataTree','apiResponse'],

    data(){
        return{
            openTree:false,
            barChart:undefined,
            activeTab:'tree'
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

        activateTab(tab){
            this.activeTab = tab;
        },

        displayStats(stats,type){

            console.log('called chart')

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
                            },
                            gridLines: {
                                display:false
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