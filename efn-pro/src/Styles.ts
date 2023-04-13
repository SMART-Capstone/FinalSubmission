const loadingStyle: React.CSSProperties = {
  position: "fixed",
  width: "100vw",
  opacity: 0.7,
  backgroundColor: "black",
  top: 0,
  bottom: 0,
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 100,
};

const flexDiv: React.CSSProperties = {
  alignItems: "center",
  display: "flex",
};

const justifyCenterContainerDiv: React.CSSProperties = {
  justifyContent: "center",
  ...flexDiv,
};
const justifySpaceBetweenContainerDiv: React.CSSProperties = {
  justifyContent: "space-between",
  ...flexDiv,
};
const justifySpaceBetweenContainerDivRow: React.CSSProperties = {
  ...justifySpaceBetweenContainerDiv,
  flexDirection: "row",
};
const justifyCenterContainerDivRow: React.CSSProperties = {
  ...justifyCenterContainerDiv,
  flexDirection: "row",
};

const justifySbContainerDivRow: React.CSSProperties = {
  ...flexDiv,
  flexDirection: "row",
  justifyContent: "space-between",
};

const justifyCenterContainerDivCol: React.CSSProperties = {
  ...justifyCenterContainerDiv,
  flexDirection: "column",
};
export {
  loadingStyle,
  justifyCenterContainerDivRow,
  justifyCenterContainerDivCol,
  justifyCenterContainerDiv,
  justifySbContainerDivRow,
  justifySpaceBetweenContainerDiv,
};
