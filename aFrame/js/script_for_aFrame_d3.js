// get the whole a-scene
    const aScene = d3.select('a-scene');

    const aEntity = aScene.append('a-entity')
                            .attr('id', 'whole')
                            .attr('position', '0 0 -15');

    //Create HUD
    const aHead = d3.select('#head');

    var hud_width = 0.5,
        hud_height = 1,
        hud_position_x = 1.65,
        hud_position_z = -1.5,
        hud_rotation = 15,
        hud_color = '#B2CFE8',
        hud_opacity_hover = 0.2,
        hud_opacity_selected = 0.6;

    var hud_hover = aHead.append('a-entity')
                            //.attr('id','hud_hover')
                            .attr('geometry',`primitive: plane; height: ${hud_height}; width: ${hud_width}`)
                            .attr('position',`${hud_position_x} 0 ${hud_position_z}`) //X,Y,Z
                            .attr('rotation', `0 -${hud_rotation} 0`)
                            .attr('material',`color: ${hud_color}; transparent: true; opacity: ${hud_opacity_hover}`)
                            .attr('text',`color: white; align: center; value: hover; width: ${hud_width}`);
    var hud_selected = aHead.append('a-entity')
                            //.attr('id','hud_selected')
                            .attr('geometry',`primitive: plane; height: ${hud_height}; width: ${hud_width}`)
                            .attr('position',`-${hud_position_x} 0 ${hud_position_z}`) //X,Y,Z
                            .attr('rotation', `0 ${hud_rotation} 0`)
                            .attr('material',`color: ${hud_color}; transparent: true; opacity: ${hud_opacity_selected}`)
                            .attr('text',`color: white; align: center; value: select team to compare; width: ${hud_width}`);
    var svg = hud_selected.append('a-curve')




// independent parameters
    const yInterval_initial = -10,
          yInterval = 5,
          numbersOfTemas = [64, 32, 16, 8, 4, 2, 1],
          angleInterval = 2* Math.PI / 64,
          maxR = 10,
          minX = - (hud_width * 0.5) * 0.9
          maxX = (hud_width * 0.5) * 0.9,
          heights = [-15, -10, -5, 0, 5, 10, 15]; // the actual heights of each round in the VR
          heights_hud = [-(hud_height * 0.5) * 0.9, -(hud_height * 0.5) * 0.6, -(hud_height * 0.5) * 0.3, 0, (hud_height * 0.5) * 0.3, (hud_height * 0.5) * 0.6, (hud_height * 0.5) * 0.9]; // the heights of the y for rounds on the HUD

    //colors assignment
        const color_Michigan = '#76AAFF',
              color_winner = '#FFEC04',
              color_loser = '#FFE98A',
              color_hoveredTeam = 'white',
              color_circleScale = 'white',
              color_oppositeLine = 'red',
              color_selfCurve = 'green',
              color_selfCurve_hud = 'white';

    const y_scale = d3.scaleOrdinal()
                      .domain(['First 4', 'First Round', 'Second Round', 'Sweet 16', 'Elite Eight', 'Semifinals', 'Final 2'])
                      .range(heights);

    const y_scale_hud = d3.scaleOrdinal()
                            .domain(['First 4', 'First Round', 'Second Round', 'Sweet 16', 'Elite Eight', 'Semifinals', 'Final 2'])
                            .range(heights_hud);


// FUNCTION to get the uniquename of a team
    const getName = (data) => {
        let usableMarketName = data.market.replace(' ', '_'),
            usableTeamName =  data.name.replace(' ', '_')
        return usableMarketName + '_' + usableTeamName;
    }




d3.csv('2017_season_detailed_cleaned.csv').then(function(data){
    var points = [], // 1.0 to collect points get by all games, for min/max ponits
        teams = {}, // 2.0 {teamUniqueName: teamIndex} to have each unique team collected and assigned teamIndex
        teamIndex = 0, // 2.1 teamIndex, this is to assign each team on specific angels
        gameTeamIdPositions = {}, // 3.0 {id: point, id: point, ...} get the pairs of id (in csv) & point position, This is for lines between opposite teams
        teamsSelfPositions = {}, // 2.2 {teamUniqueName:[points], ...} This is for curves among themselves through rounds
        teamsSelfPositions_hud = {}, // 2.3 {teamUniqueName:[points_hud], ...} This is for curves among themselves through rounds on the HUD
        teamsShownOnHud = []; // 4.0 [teamUniqueName, ...] Identify the curves of which teams are shown and in comparison

    // assigne teamIndex to each team named teamUniqueName
        data.forEach((d)=>{
            points.push(+d.points_game);

            let teamName = getName(d);
            if(! teams.hasOwnProperty(teamName)) teams[teamName] = teamIndex++;
        })

    // parameters that need csv
    const maxPoint = Math.max(...points),
          minPoint = Math.min(...points);

    const r_scale = d3.scaleLinear()
                          .domain([minPoint, maxPoint])
                          .range([maxR, 0]);

    const x_scale_hud = d3.scaleLinear()
                        .domain([minPoint, maxPoint])
                        .range([minX, maxX]);

    // FUNCTION to position a team at a round
    const teamPlace = (teamIndex, score, round) => {
        let this_r = r_scale(score);
        let x_position = Math.cos(angleInterval * teamIndex) * this_r,
            y_position = y_scale(round),
            z_position = Math.sin(angleInterval * teamIndex) * this_r;
        return(`${x_position} ${y_position} ${z_position}`);
    };

    // FUNCTION to position a team at a round on the HUD
    const teamPlace_hud = (score, round) => {
        let x_position_hud = x_scale_hud(score),
            y_position_hud = y_scale_hud(round);
        return(`${x_position_hud} ${y_position_hud}`);
    };


    // create curves among the team itself of different rounds
        // collection for all the a-curves
            var curves = {}; // {teamUniqueNames: 0, teamUniqueNames: 1, ...} teamUniqueNames for teams that already been detected, 0 means it has only one point so no curve, 1 means it has a curve

        // FUNCTION create the curves among the team itself at different rounds
        // AND create curves on the HUD
            const drawTeamCurve = (teamUniqueName) => {
                let curveId = `#${teamUniqueName}`,
                    curveId_hud = `#${teamUniqueName}_hud`
                // if the team has been detected
                    if (curves.hasOwnProperty(teamUniqueName)){
                        // // if the team has a curve, then draw it
                        //     if (curves[teamUniqueName] == 1){  // curve is {teamUniqueNames: 0, teamUniqueNames: 1, ...}. teamUniqueNames for teams that already been detected, 0 means it has only one point so no curve, 1 means it has a curve
                        //         aEntity.append('a-draw-curve')
                        //                 .attr('material', `shader: line; color: ${color_selfCurve};`)
                        //                 .attr('curveref', curveId);
                        //         hud_selected.append('a-draw-curve')
                        //                     .attr('material', `shader: line; color: ${color_selfCurve};`)
                        //                     .attr('curveref', curveId_hud);
                        //         // console.log("This team is in record, draw again!");
                        //     } else{
                        //         // console.log("This team is in record, but it does not make any progress in the tournament...");
                        //     }
                    }
                // if the team has not been detected, then let's detect
                    else {
                        let positions = teamsSelfPositions[teamUniqueName],  // {teamName:[points], ...}, this is generated when the node was generated
                            positions_hud = teamsSelfPositions_hud[teamUniqueName];
                        // if the team has only one point, it will have no curve, so just record it
                            if (positions.length == 1) {
                                // record
                                    curves[teamUniqueName] = 0;
                            }
                        // else, record it, construct the curve, and then draw it
                            else {
                                // record
                                    curves[teamUniqueName] = 1;
                                // sort the positions array
                                    positions.sort((a,b)=>{
                                        var y_a = a.split(" ")[1],
                                            y_b = b.split(" ")[1];
                                        return y_a - y_b;
                                    });
                                    positions_hud.sort((a,b)=>{
                                        var y_a = a.split(" ")[1],
                                            y_b = b.split(" ")[1];
                                        return y_a - y_b;
                                    });
                                // construct the curve from the array
                                    let thisCurve = aEntity.append('a-curve')
                                                            .classed('selfCurve', true)
                                                            .attr('id', teamUniqueName);
                                    let thisCurve_hud = hud_selected.append('a-curve')
                                                                    .classed('selfCurve_hud', true)
                                                                    .attr('id', `${teamUniqueName}_hud`);
                                // put each point as an a-curve-point into the a-curve
                                    positions.forEach((p) => {
                                        thisCurve.append('a-curve-point')
                                                 .attr('position', p)
                                    });
                                    positions_hud.forEach((p_h) => {
                                        thisCurve_hud.append('a-curve-point')
                                                     .attr('position', p_h)
                                    });

                                // draw the curve
                                    aEntity.append('a-draw-curve')
                                            .attr('id', `${teamUniqueName}Curve`)
                                            .attr('curveref', () => curveId)
                                            .attr('material', `color: ${color_selfCurve}; opacity: 0.3`)
                                    hud_selected.append('a-draw-curve')
                                                .attr('id', `${teamUniqueName}Curve_hud`)
                                                .attr('curveref', () => curveId_hud)
                                                .attr('material', `color: ${color_selfCurve}; opacity: 0.0`)
                            }
                    }
            }


    // create the spheres as teams
        aEntity.selectAll('.team')
                .data(data)
                .enter()
                .append('a-sphere')
                    .attr('id', (d) => d.id)
                    .attr('class', (d) => {
                        let teamUniqueName = getName(d);
                        return `team ${teamUniqueName}Node`;
                    })
                    .attr('color', (d)=> {
                        if(d.market == 'Michigan'){
                            return color_Michigan;
                        } else if(d.id < 67){
                            return color_winner;
                        } else{
                            return color_loser;
                        }
                    })// here the color can be changed based on leage or something (maybe another scale is needed)
                    .attr('scale', '0.15 0.15 0.15') // the scale can be changed based on Seed like `${0.1 * d.Seed} ${0.1 * d.Seed} ${0.1 * d.Seed}`
                    .attr('position', (d) => {
                        let teamUniqueName = getName(d),
                            thisPosition = teamPlace(teams[teamUniqueName], d.points_game, d.tournament_round),
                            thisPosition_hud = teamPlace_hud(d.points_game, d.tournament_round);
                        // record the position for rival lines
                            gameTeamIdPositions[d.id] = thisPosition;
                        // record the position for self curves
                            if (! teamsSelfPositions.hasOwnProperty(teamUniqueName)){
                                teamsSelfPositions[teamUniqueName] = [thisPosition];
                                teamsSelfPositions_hud[teamUniqueName] = [thisPosition_hud];
                            } else {
                                teamsSelfPositions[teamUniqueName].push(thisPosition);
                                teamsSelfPositions_hud[teamUniqueName].push(thisPosition_hud);
                            }
                        return thisPosition;
                    })
                    // .attr('event-set__mouseenter', function(d){ // a-frame way of on "mouseenter"
                    //     return 'material.opacity: 0.5';
                    // })
                    // .attr('event-set__mouseleave', function(){ // a-frame way of on "mouseleave"
                    //     return 'material.opacity: 1';
                    // })
                    .on('mouseenter', function(d){
                        // change this node's style
                            this.setAttribute('opacity', '0.5');

                        let teamUniqueName = getName(d);
                        // change the color of all this team's nodes
                            let teamNodes = document.querySelectorAll(`.${teamUniqueName}Node`);
                            teamNodes.forEach((node) => {
                                node.setAttribute('color', color_hoveredTeam);
                            });

                        // change the style of this team's curve
                            let selectedCurve = document.querySelector(`#${teamUniqueName}Curve`);
                            selectedCurve.setAttribute('material', `color: ${color_selfCurve}; opacity: 0.8`);

                        // show information of the team on the "hover" hud
                        hud_hover.attr('text',`color: white; align: center; value: ${teamUniqueName}; width:${hud_width}`)

                        // console.log(hud_hover)
                    })
                    .on('mouseleave', function(d){
                        // set this node's style back
                            this.setAttribute('opacity', '1');

                        let teamUniqueName = getName(d);
                        // set the color of all this team's nodes back
                            let teamNodes = document.querySelectorAll(`.${teamUniqueName}Node`);
                            teamNodes.forEach((node) => {
                                let market = node.classList[1].split('_')[0],
                                    thisId = +node.id,
                                    originColor;
                                if (market == 'Michigan'){
                                    originColor = color_Michigan;
                                } else if(thisId < 67){
                                    originColor = color_winner;
                                } else{
                                    originColor = color_loser;
                                }
                                node.setAttribute('color', originColor);
                            });

                        // set the style of this team's curve back as long as it's not selected
                            let selectedCurve = document.querySelector(`#${teamUniqueName}Curve`),
                                currentCurveOpacity = selectedCurve.getAttribute('material').opacity;
                            if(currentCurveOpacity == 0.8) {
                                selectedCurve.setAttribute('material', `color: ${color_selfCurve}; opacity: 0.3`);
                            }

                        // show information of the team on the "hover" hud
                        hud_hover.attr('text',`color: white; align: center; value: hover; width: ${hud_width}`)

                        // console.log(this)
                    })
                    .on('click', function(d){
                        let teamUniqueName = getName(d),

                            selectedCurve = document.querySelector(`#${teamUniqueName}Curve`),
                            currentCurveOpacity = selectedCurve.getAttribute('material').opacity,

                            selectedCurve_hud = document.querySelector(`#${teamUniqueName}Curve_hud`),
                            currentCurveOpacity_hud = selectedCurve_hud.getAttribute('material').opacity;

                        // emphasize or unemphasize the curve in 3D
                            if(currentCurveOpacity == 0.8) {
                                selectedCurve.setAttribute('material', `color: ${color_selfCurve}; opacity: 1`);
                            } else {
                                selectedCurve.setAttribute('material', `color: ${color_selfCurve}; opacity: 0.8`);
                            };

                        //show or hide the curve on selected panel
                            if(currentCurveOpacity_hud == 0.0) {
                                selectedCurve_hud.setAttribute('material', `color: ${color_selfCurve_hud}; opacity: 1`);
                                teamsShownOnHud.push(teamUniqueName);
                                hud_selected.attr('text',`color: white; align: center; value:  ; width: ${hud_width}`)
                            } else {
                                selectedCurve_hud.setAttribute('material', `color: ${color_selfCurve_hud}; opacity: 0.0`);
                                for(let i = 0; i < teamsShownOnHud.length; i ++){
                                    if(teamsShownOnHud[i] == teamUniqueName) {
                                        teamsShownOnHud.splice(i, 1)
                                    };
                                }
                                if(teamsShownOnHud.length == 0) {
                                    hud_selected.attr('text',`color: white; align: center; value: select team to compare; width: ${hud_width}`)
                                }
                            };

                    })



    // create the circles as round scales (the lower the score, the outer)
        // set the lineweight
            var torusLineWeight = 0.005,
                ringLineWeight = 0.025;
        // draw it the 3D way
            aEntity.selectAll('.circleRuller')
                    .data(data)
                    .enter()
                    .append('a-torus')
                    .classed('circleRuller', true)
                    .attr('color', color_circleScale)
                    .attr('opacity', 0.1)
                    .attr('rotation', '90 0 0')
                    .attr('radius', (d) => r_scale(d.points_game))
                    .attr('radius-tubular', torusLineWeight)
                    .attr('segments-tubular', 100)
                    .attr('position', (d) => {
                        let thisHeight = y_scale(d.tournament_round);
                        return `0 ${thisHeight} 0`;
                    })

        // // or draw it the 2D way
        //     aEntity.selectAll('.circleRuller')
        //             .data(data)
        //             .enter()
        //             .append('a-ring')
        //             .classed('circleRuller', true)
        //             .attr('side', 'double')
        //             .attr('color', color_circleScale)
        //             .attr('opacity', 0.1)
        //             .attr('rotation', '90 0 0')
        //             .attr('radius-outer', (d) => r_scale(d.points_game) + ringLineWeight/2)
        //             .attr('radius-inner', (d) => r_scale(d.points_game) - ringLineWeight/2)
        //             .attr('segments-theta', 100)
        //             .attr('position', (d) => `0 ${y_scale(d.tournament_round)} 0`)

    // create the target to move to a different height
        const headRig = d3.select("#cameraRig");
        var heightAt = 0;
        // console.log("hey");
        aEntity.selectAll(".heightPort")
                .data(heights)
                .enter()
                .append('a-ring')
                .classed('heightPort', true)
                .attr('id',(d) => `heightPort_${d}`)
                .attr('position', (d) => `0 ${d} 0`)
                .attr('radius-outer', '18')
                .attr('radius-inner', '15')
                .attr('rotation', '90 0 0')
                .attr('side', 'double')
                .attr('segments-theta', 100)
                .attr('color', 'gold')
                .attr('opacity', 0.1)
                .attr('event-set__mouseenter', 'opacity: 0.8')
                .attr('event-set__mouseleave', 'opacity: 0.1')
                .on('click', (d) => {
                    // console.log(headRig.attr('position'))
                    let targetHeight = d;
                    let currentPosition = headRig.attr('position');
                    let targetPosition = currentPosition;
                    targetPosition.y = targetHeight;

                    // // change the plane the teleport curve touch as the height changes
                    //     let collidePlane = document.querySelector("#telePortCollisionEntity");
                    //     collidePlane.setAttribute("position", `0 ${targetHeight} 0`)

                    headRig.attr('position', targetPosition)
                })



    // create the lines between the opposite teams
        const data_firstHalf = data.slice(0, 67);
        aEntity.selectAll('.rivalLine')
                .data(data_firstHalf)
                .enter()
                .append('a-entity')
                .classed('rivalLine', true)
                .attr('line', (d)=>{
                    //format: <a-entity line="start: 0, 1, 0; end: 2 0 -5; color: red"></a-entity>
                    let thisTeamPosition = gameTeamIdPositions[d.id],
                        thatTeamPosition = gameTeamIdPositions[+d.id + 67];
                    return `start: ${thisTeamPosition}; end: ${thatTeamPosition}; color: ${color_oppositeLine}; opacity: 0.75`;
                })


    // Draw all curves, because for some reasons, draw curves one by one does not work...
        var teamUniqueNames = Object.keys(teams);
        teamUniqueNames.forEach((uniqueName) => {
            // console.log(uniqueName);
            drawTeamCurve(uniqueName)
        })



})
