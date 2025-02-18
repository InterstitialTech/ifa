import React, { useCallback, useEffect, useState } from "react";
import clsx from "clsx";
import PropTypes from "prop-types";
import { makeStyles } from "@material-ui/styles";
import { useIntl } from "react-intl";
import Title from "../../../common/components/Title";
import CloseOutlinedIcon from "@material-ui/icons/CloseOutlined";
import PlaylistAddCheckOutlinedIcon from "@material-ui/icons/PlaylistAddCheckOutlined";
import { IconButton, Tooltip } from "@material-ui/core";
import Spacer from "../../../common/components/Spacer";
import Button from "../../../common/components/Button";
import AddOutlinedIcon from "@material-ui/icons/AddOutlined";
import TaskSidebar from "../ProcessingPage/TaskSidebar";
import NavigateNextOutlinedIcon from "@material-ui/icons/NavigateNextOutlined";
import TemplateList from "./TemplateList";
import { useServer } from "../../../server-api/context";
import { useDispatch, useSelector } from "react-redux";
import { updateTask } from "../../state/tasks/actions";
import TaskRequest from "../../state/tasks/TaskRequest";
import loadTemplates from "./loadTemplates";
import { selectTemplates } from "../../state/selectors";
import { setTemplates } from "../../state/templates/actions";
import AddTemplateDialog from "./AddTemplateDialog";
import useTemplateAPI from "./useTemplateAPI";
import { updateFilters } from "../../state/fileList/actions";
import { routes } from "../../../routing/routes";
import { useHistory } from "react-router-dom";

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.dimensions.content.padding,
    paddingTop: theme.dimensions.content.padding * 3,
    minWidth: theme.dimensions.collectionPage.width,
    display: "flex",
    alignItems: "stretch",
  },
  templates: {
    flexGrow: 1,
  },
  tasks: {
    marginLeft: theme.spacing(4),
    maxWidth: 380,
  },
  description: {
    flexGrow: 1,
    flexShrink: 0,
    [theme.breakpoints.down("md")]: {
      display: "none",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    alignItems: "stretch",
  },
  addButton: {
    flexShrink: 0,
  },
}));

/**
 * Get translated text.
 */
function useMessages() {
  const intl = useIntl();
  return {
    title: intl.formatMessage({ id: "templates.myTemplates" }),
    process: intl.formatMessage({ id: "templates.process" }),
    addTemplate: intl.formatMessage({ id: "actions.addTemplate" }),
    showTasks: intl.formatMessage({ id: "actions.showTasks" }),
    hideTasks: intl.formatMessage({ id: "actions.hideTasks" }),
    runTemplateMatching: intl.formatMessage({
      id: "actions.runTemplateMatching",
    }),
  };
}

function TemplatesHeader(props) {
  const { onAddTemplate, onShowTasks, tasksShown, className, ...other } = props;
  const messages = useMessages();
  const classes = useStyles();

  return (
    <Title text={messages.title} className={className} {...other}>
      <Button
        className={classes.addButton}
        color="primary"
        variant="contained"
        onClick={onAddTemplate}
      >
        <AddOutlinedIcon />
        {messages.addTemplate}
      </Button>
      <Spacer />
      {!tasksShown && (
        <Tooltip title={messages.showTasks}>
          <IconButton
            color="inherit"
            onClick={onShowTasks}
            aria-label={messages.showTasks}
          >
            <PlaylistAddCheckOutlinedIcon color="inherit" fontSize="large" />
          </IconButton>
        </Tooltip>
      )}
    </Title>
  );
}

TemplatesHeader.propTypes = {
  onAddTemplate: PropTypes.func.isRequired,
  onShowTasks: PropTypes.func.isRequired,
  tasksShown: PropTypes.bool.isRequired,
  className: PropTypes.string,
};

function TasksHeader(props) {
  const { onClose, className, ...other } = props;
  const messages = useMessages();
  return (
    <Title text={messages.process} className={className} {...other}>
      <Spacer />
      <Tooltip title={messages.hideTasks}>
        <IconButton
          color="inherit"
          onClick={onClose}
          aria-label={messages.hideTasks}
        >
          <CloseOutlinedIcon color="inherit" fontSize="large" />
        </IconButton>
      </Tooltip>
    </Title>
  );
}

TasksHeader.propTypes = {
  /**
   * Handle task close.
   */
  onClose: PropTypes.func.isRequired,
  className: PropTypes.string,
};

function ProcessingPage(props) {
  const { className, ...other } = props;
  const classes = useStyles();
  const messages = useMessages();
  const server = useServer();
  const history = useHistory();
  const dispatch = useDispatch();
  const [showNewTemplateDialog, setShowNewTemplateDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTasks, setShowTasks] = useState(true);
  const handleShowTasks = useCallback(() => setShowTasks(true));
  const handleHideTasks = useCallback(() => setShowTasks(false));
  const templates = useSelector(selectTemplates).templates;
  const TemplateAPI = useTemplateAPI();

  useEffect(() => {
    if (templates.length === 0) {
      loadTemplates(server).then((templates) =>
        dispatch(setTemplates(templates))
      );
    }
  }, []);

  const showTemplateDialog = useCallback(() => setShowNewTemplateDialog(true));
  const hideTemplateDialog = useCallback(() => setShowNewTemplateDialog(false));

  const filterTemplateTasks = useCallback(
    (task) => task?.request?.type === TaskRequest.MATCH_TEMPLATES,
    []
  );

  const showMatches = useCallback((template) => {
    dispatch(updateFilters({ templates: [template.id] }));
    history.push(routes.collection.fingerprints, { keepFilters: true });
  });

  const handleProcess = useCallback(() => {
    setLoading(true);
    server
      .createTask({
        request: { type: "MatchTemplates" },
      })
      .then((response) => {
        if (response.success) {
          dispatch(updateTask(response.data));
        }
      })
      .finally(() => setLoading(false));
  });

  useEffect(() => {
    loadTemplates(server).then(setTemplates);
  }, []);

  return (
    <div className={clsx(classes.root, className)} {...other}>
      <div className={clsx(classes.column, classes.templates)}>
        <TemplatesHeader
          onAddTemplate={showTemplateDialog}
          onShowTasks={handleShowTasks}
          tasksShown={showTasks}
        />
        <TemplateList>
          {templates.map((template) => (
            <TemplateList.Item
              key={template.id}
              template={template}
              onChange={TemplateAPI.updateTemplate}
              onAddExamples={TemplateAPI.uploadExample}
              onDeleteExample={TemplateAPI.deleteExample}
              onDelete={TemplateAPI.deleteTemplate}
              onShowMatches={showMatches}
            />
          ))}
        </TemplateList>
      </div>
      {showTasks && (
        <div className={clsx(classes.column, classes.tasks)}>
          <TasksHeader onClose={handleHideTasks} />
          <TaskSidebar filter={filterTemplateTasks} />
          <Button
            variant="contained"
            color="primary"
            onClick={handleProcess}
            disabled={loading}
          >
            {messages.runTemplateMatching}
            <NavigateNextOutlinedIcon />
          </Button>
        </div>
      )}
      <AddTemplateDialog
        open={showNewTemplateDialog}
        onClose={hideTemplateDialog}
      />
    </div>
  );
}

ProcessingPage.propTypes = {
  className: PropTypes.string,
};

export default ProcessingPage;
