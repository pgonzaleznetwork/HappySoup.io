<template>
    <div v-if="apiResponseHasData">

        <div class="notification is-danger is-light">
            <span v-html="warningMessage"></span>
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
                <li v-if="apiResponse.utilization" :class="{'is-active':activeTab == 'utilization'}">
                    <a @click.prevent="activateTab('utilization')">
                        <span class="icon is-small"><i class="fas fa-chart-pie" aria-hidden="true"></i></span>
                        <span>Field Utilization</span>
                    </a>
                </li>
            </ul>
        </div>

        <FileDownloadButtons @xml="downloadXml(apiResponse)"
            @excel="copyFile('excel',apiResponse)"
            @csv="copyFile('csv',apiResponse)"
         />

        <section v-show="activeTab == 'tree'">
            <div class="is-flex is-flex-direction-row is-justify-content-space-between mb-4">
                <div>
                    <button class="button is-small is-info is-light" @click="toggleTree">
                        {{treeControlLabel}}
                    </button>
                </div>
                
            </div>
            <div class="treeHead">
                <i class="fas fa-box-open"></i>
                {{apiResponse.entryPoint.name}}
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

        <section v-show="activeTab == 'utilization' && apiResponse.utilization">

                <Utilization :data="apiResponse.utilization"/>
                
                <div class="canvas-container mt-5 mb-4 ml-3">
                    <canvas ref="utilizationCanvas"></canvas>
                </div>
                      
        </section>

        <section v-if="activeTab == 'utilization' && apiResponse.utilization?.error">
            <Error  :error="apiResponse.utilization.error"/> 
        </section>

    </div>
    <div v-else>
        <div class="notification is-warning is-light">
            <span v-html="noResultsDescription"></span>
        </div>
    </div>
     
</template>

<script>

import MetadataTree from '@/components/metadata-visualization/MetadataTree.vue';
import Utilization from '@/components/metadata-visualization/Utilization.vue';
import fileExports from '@/functions/fileExports'
import MetadataTable from '@/components/metadata-visualization/MetadataTable.vue'
import FileDownloadButtons from '@/components/metadata-visualization/FileDownloadButtons.vue'

export default {

    setup(){
      let {copyFile,downloadXml} = fileExports();
      return {copyFile,downloadXml};
    },

    components:{MetadataTree,MetadataTable,FileDownloadButtons,Utilization},

    props:['metadataTree','apiResponse'],

    data(){
        return{
            openTree:false,
            statsChart:undefined,
            utilizationChart:undefined,
            activeTab:'tree'
        }
    },

    mounted(){
        this.displayStats(this.apiResponse.stats,'usage');
        if(this.apiResponse.utilization){
            this.displayUtilization(this.apiResponse.utilization);
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

            console.log('calling displayStats');

            //remove the contents of the previously initialized chart
            if(this.statsChart){
                this.statsChart.destroy();
            }

            let availableBackgroundColors = [
                'rgba(46, 204, 113,1.0)',
                'rgba(52, 152, 219,1.0)',
                'rgba(231, 76, 60,1.0)',
                'rgba(230, 126, 34,1.0)',
                'rgba(241, 196, 15,1.0)',
                'rgba(142, 68, 173,1.0)',
                'rgba(196, 229, 56,1.0)',
                'rgba(27, 20, 100,1.0)',
                'rgba(237, 76, 103,1.0)',
                'rgba(153, 128, 250,1.0)'
            ];

            let chartLabels = [];
            let chartValues = [];

            for (const key in stats) {
                chartLabels.push(key);
                chartValues.push(stats[key]);
            }

            let backgroundColors = [];

            let colorsUsed = 0;
            chartLabels.forEach(val => {

                //we used all the available colors so just pick a random one
                if(colorsUsed > availableBackgroundColors){
                    let randomValue = availableBackgroundColors[Math.floor(Math.random() * availableBackgroundColors.length)]; 
                    backgroundColors.push(randomValue);
                }
                else{
                    backgroundColors.push(availableBackgroundColors[colorsUsed]);
                    colorsUsed++;
                }  
            })

            let canvas = this.$refs.stats;

            if(!canvas) return;

            let ctx = canvas.getContext('2d');

            let label = (type === 'usage' ? '# of Metadata Types using it' : '# of Metadata Types required for deployment');

            this.statsChart = new Chart(ctx, {
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
        },

         displayUtilization(utilization){

             if(!this.apiResponse.utilization || this.apiResponse.utilization?.error) return;

            //remove the contents of the previously initialized chart
            if(this.utilizationChart){
                this.utilizationChart.destroy();
            }

            let availableBackgroundColors = [
                'rgba(46, 204, 113,1.0)',
                'rgba(52, 152, 219,1.0)',
                'rgba(231, 76, 60,1.0)',
                'rgba(230, 126, 34,1.0)',
                'rgba(241, 196, 15,1.0)',
                'rgba(142, 68, 173,1.0)',
                'rgba(196, 229, 56,1.0)',
                'rgba(27, 20, 100,1.0)',
                'rgba(237, 76, 103,1.0)',
                'rgba(153, 128, 250,1.0)'
            ];

            let chartLabels = [];
            let chartValues = [];

            for (const key in utilization.recordTypeCount) {
                chartLabels.push(key);
                chartValues.push(utilization.recordTypeCount[key]);
            }

            let backgroundColors = [];

            let colorsUsed = 0;
            chartLabels.forEach(val => {

                //the empty set is also represented with the same color
                if(val == 'empty'){
                    backgroundColors.push('rgba(52, 73, 94,1.0)')
                }
                else{

                    //we used all the available colors so just pick a random one
                    if(colorsUsed > availableBackgroundColors){
                        let randomValue = availableBackgroundColors[Math.floor(Math.random() * availableBackgroundColors.length)]; 
                        backgroundColors.push(randomValue);
                    }
                    else{
                        backgroundColors.push(availableBackgroundColors[colorsUsed]);
                        colorsUsed++;
                    }
                }  
            })

            let utilizationCanvas = this.$refs.utilizationCanvas;

            if(!utilizationCanvas) return;


            let ctx = utilizationCanvas.getContext('2d');

            let label = 'Field Utilization by Record Type'

            this.utilizationChart = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: chartLabels,
                    datasets: [{
                        label: label,
                        data: chartValues,
                        backgroundColor: backgroundColors,
                        borderWidth: 2
                    }]
                },
                options:{
                    title: {
                        display: true,
                        text: `${utilization.field} utilization`
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

        warningMessage(){
            return `
                HappySoup uses the Dependency API to retrieve dependency information.
                This API does not cover all metadata types. I recommend you use <a style="font-weight:bold" href="youtube.com">this app</a> as it covers all metadata types with its easy to use full-text search.
            `
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
                text += `is being used by <b>${total} metadata items</b>. Changes to the ${type} <b>can impact these items</b>`
            }
            else{
                text += `depends <b>${total} metadata items</b>. All the metadata items below represent <b>what is needed to deploy this
                component to an empty org (like a scratch org)</b>`
            }

            if(type == 'StandardField'){
                text += '<br> This page does <b>not</b> show if the standard field is used in page layouts. This feature is only available for custom fields.'
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

    .treeHead{
        font-weight:500;
        margin-bottom: 10px;
    }

    .canvas-container{
        width:800px;
        height:400px;
        position:relative;
    }

    canvas{
        background-color:white;
    }

</style>