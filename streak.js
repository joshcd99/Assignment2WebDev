/**
 * @description Displays or removes the streak GIF in the score container based on
 *              the current answer streak count. Shows the GIF when streak exceeds 1,
 *              removes all streak images otherwise.
 * @param {number} streak - The current consecutive correct answer streak count
 * @returns {void}
 */
export function streakImage(streak){

    //get ID for current Streak to see if it will be displayed
    let currentStreak = document.getElementById("streak-image");

    if(streak > 1){
        //Create image
        const streakImg = document.createElement("img");
        streakImg.id = "streak-image";
        streakImg.alt = "You have a streak";
        streakImg.src = "Images/Streak.gif";
        //Put the image into the score-container
        const score_container = document.getElementById("score-container");
        score_container.appendChild(streakImg);
    }
    else{
        //Delete the streak gif if streak < 2 and if it exsists
        if(currentStreak){
            //For each image that has been created with ID of streak-image DELETE/REMOVE
            document.querySelectorAll("#streak-image").forEach(img => img.remove());
        }
        
    }
}