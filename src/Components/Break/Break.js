import React from 'react';

const Break = ({top, bot, name}) => {
    return(
        <div 
            className='break'
            style={{
                top,
                height: bot - top,
                display: bot - top > 5 ? "flex" : "none",
            }}
        >
            <p>{name}</p>
        </div>
    )
}

export default Break;