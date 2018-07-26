import React from 'react';
import {connect} from 'react-redux';

const Takaro = ({cover}) => {
    return (
        <div className='createFl' style={{
            display: cover,
            height: '3000px', 
            width: '3000px',
            backgroundColor: 'rgba(255, 255, 255, 0.425)',
            zIndex: '1',
            top: '0',
            left: '0'
        }}></div>
    );
}

function mapStateToProps(state) {
    return {
        cover: state.cover
    };
}
export default connect(mapStateToProps)(Takaro);