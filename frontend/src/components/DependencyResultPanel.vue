<template>
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
        Primar lorem ipsum dolor sit amet, consectetur
        adipiscing elit lorem ipsum dolor. <strong>Pellentesque risus mi</strong>, tempus quis placerat ut, porta nec nulla. Vestibulum rhoncus ac ex sit amet fringilla. Nullam gravida purus diam, et dictum <a>felis venenatis</a> efficitur.
    </div>
    <div class="canvas-container mt-5 mb-4 ml-3">
        <canvas ref="stats"></canvas>
    </div>
    
    
    <MetadataTree :metadata="metadataTree" :parent-open="openTree"/>  
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

    watch: {
        
        apiResponse: function (newValue, oldValue) {
            console.log(newValue)
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

            console.log('is this called at all')

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

            console.log(canvas);

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