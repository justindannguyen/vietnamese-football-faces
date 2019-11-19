import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import LiveDetection from './components/LiveDetection'

const useStyles = makeStyles(theme => ({
  root: {
    flexGrow: 1,
  },
  paper: {
    padding: theme.spacing(2),
    textAlign: 'center',
    color: theme.palette.text.secondary,
  },
}));

export default function App() {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <LiveDetection />
    </div>
  );
}
