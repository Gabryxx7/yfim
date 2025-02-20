
const initControlParams = {
  zoom: 200,
  occlusion_mask: false, //Switch
  feature_show: {
    eyes: {
      toggle: false,
      sliderIndex: 0,
    },
    mouth: {
      toggle: false,
      sliderIndex: 0,
    },
    nose: {
      toggle: false,
      sliderIndex: 0,
    },
    bar: {
      toggle: false,
      direction: false,
      sliderIndex: 0,
      position: 0,
    },
  },
};


const controlParamsReducer = (state = initControlParams, action) => {
  switch (action.type) {
    case "UPDATE_ALL": {
      console.log(action.payload);
      return {
        ...action.payload,
      };
    }
    case "UPDATE_MASK": {
      return {
        ...state,
        occlusion_mask: action.payload,
      };
    }
    case "UPDATE_EYE": {
      return {
        ...state,
        feature_show: {
          ...state.feature_show,
          eyes: action.payload,
        },
      };
    }
    case "UPDATE_MOUTH": {
      return {
        ...state,
        feature_show: {
          ...state.feature_show,
          mouth: action.payload,
        },
      };
    }
    case "UPDATE_NOSE": {
      return {
        ...state,
        feature_show: {
          ...state.feature_show,
          nose: action.payload,
        },
      };
    }
    case "UPDATE_BAR": {
      return {
        ...state,
        feature_show: {
          ...state.feature_show,
          bar: action.payload,
        },
      };
    }
    default:
      return state;
  }
};

export { initControlParams , controlParamsReducer}