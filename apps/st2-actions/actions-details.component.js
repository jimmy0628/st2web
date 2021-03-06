import React from 'react';
import { PropTypes } from 'prop-types';
import { connect } from 'react-redux';
import store from './store';

import api from '@stackstorm/module-api';
import notification from '@stackstorm/module-notification';
import setTitle from '@stackstorm/module-title';

import { Link } from 'react-router-dom';
import ActionReporter from '@stackstorm/module-action-reporter';
import AutoForm from '@stackstorm/module-auto-form';
import StringField from '@stackstorm/module-auto-form/fields/string';
import {
  FlexTable,
  FlexTableRow,
  FlexTableColumn,
  FlexTableInsert,
} from '@stackstorm/module-flex-table';
import FlowLink from '@stackstorm/module-flow-link';
import Button from '@stackstorm/module-forms/button.component';
import Highlight from '@stackstorm/module-highlight';
import Label from '@stackstorm/module-label';
import {
  PanelDetails,
  DetailsHeader,
  DetailsSwitch,
  DetailsBody,
  DetailsPanel,
  DetailsPanelEmpty,
  DetailsPanelBody,
  DetailsToolbar,
  DetailsToolbarSeparator,
} from '@stackstorm/module-panel';
import Time from '@stackstorm/module-time';

@connect((state) => {
  const { action, executions } = state;
  return { action, executions };
})
export default class ActionsDetails extends React.Component {
  static propTypes = {
    handleNavigate: PropTypes.func.isRequired,
    handleRun: PropTypes.func.isRequired,

    id: PropTypes.string,
    section: PropTypes.string,
    action: PropTypes.object,
    executions: PropTypes.array,
  }

  state = {
    runPreview: false,
    runValue: null,
    runTrace: null,
    executionsVisible: {},
  }

  componentDidMount() {
    api.listen().then((source) => {
      this._source = source;

      this._executionCreateListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'CREATE_EXECUTION',
          record,
        });
      };

      this._executionUpdateListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'UPDATE_EXECUTION',
          record,
        });
      };

      this._executionDeleteListener = (e) => {
        const record = JSON.parse(e.data);

        if (record.action.id !== this.props.action.id) {
          return;
        }

        store.dispatch({
          type: 'DELETE_EXECUTION',
          record,
        });
      };

      this._source.addEventListener('st2.execution__create', this._executionCreateListener);
      this._source.addEventListener('st2.execution__update', this._executionUpdateListener);
      this._source.addEventListener('st2.execution__delete', this._executionDeleteListener);
    });

    const { id } = this.props;

    if (id) {
      this.fetchAction(id);
    }
  }

  componentDidUpdate(prevProps) {
    const { id } = this.props;

    if (id && id !== prevProps.id) {
      this.fetchAction(id);
    }
  }

  componentWillUnmount() {
    this._source.removeEventListener('st2.execution__create', this._executionCreateListener);
    this._source.removeEventListener('st2.execution__update', this._executionUpdateListener);
    this._source.removeEventListener('st2.execution__delete', this._executionDeleteListener);
  }

  refresh() {
    const { id } = this.props;

    this.fetchAction(id);
  }

  fetchAction(id) {
    store.dispatch({
      type: 'FETCH_ACTION',
      promise: api.request({ path: `/actions/views/overview/${id}` }),
    })
      .then(() => {
        this.setState({ runValue: {}, runTrace: '' });
      })
      .catch((err) => {
        notification.error(`Unable to retrieve action "${id}".`, { err });
        throw err;
      })
    ;

    store.dispatch({
      type: 'FETCH_EXECUTIONS',
      promise: api.request({
        path: '/executions',
        query: {
          action: id,
          limit: 5,
          exclude_attributes: 'trigger_instance',
          parent: 'null',
        },
      }),
    })
      .catch((err) => {
        notification.error(`Unable to retrieve history for action "${id}".`, { err });
        throw err;
      })
    ;
  }

  handleSection(section) {
    const { id } = this.props;
    return this.props.handleNavigate({ id, section });
  }

  handleToggleRunPreview() {
    let { runPreview } = this.state;

    runPreview = !runPreview;

    this.setState({ runPreview });
  }

  handleToggleExecution(id) {
    this.setState({
      executionsVisible: {
        ...this.state.executionsVisible,
        [id]: !this.state.executionsVisible[id],
      },
    });
  }

  handleRun(e, ...args) {
    e.preventDefault();

    return this.props.handleRun(...args);
  }

  render() {
    const { section, action, executions } = this.props;

    if (!action) {
      return null;
    }

    setTitle([ action.ref, 'Actions' ]);

    return (
      <PanelDetails data-test="details">
        <DetailsHeader
          title={( <Link to={`/actions/${action.ref}`}>{action.ref}</Link> )}
          subtitle={action.description}
        />
        <DetailsSwitch
          sections={[
            { label: 'Parameters', path: 'general' },
            { label: 'executions', path: 'executions' },
            { label: 'Code', path: 'code', className: [ 'icon-code', 'st2-details__switch-button' ] },
          ]}
          current={section}
          onChange={({ path }) => this.handleSection(path)}
        />

        { section === 'general' ? (
          <DetailsBody>
            <DetailsToolbar key="toolbar">
              <Button value="Run" data-test="run_submit" onClick={(e) => this.handleRun(e, action.ref, this.state.runValue, this.state.runTrace || undefined)} />
              <Button flat value="Preview" onClick={() => this.handleToggleRunPreview()} />
              <DetailsToolbarSeparator />
              { action.runner_type === 'mistral-v2' ? (
                <FlowLink action={action.ref} data-test="flow_link" />
              ) : null }
            </DetailsToolbar>
            { this.state.runPreview && <Highlight key="preview" well data-test="action_code" code={this.state.runValue} /> }
            <DetailsPanel key="panel" data-test="action_parameters">
              <DetailsPanelBody>
                <form>
                  <AutoForm
                    spec={{
                      type: 'object',
                      properties: action.parameters,
                    }}
                    data={this.state.runValue}
                    onChange={(runValue) => this.setState({ runValue })}
                  />
                  <StringField
                    name="trace-tag"
                    spec={{}}
                    value={this.state.runTrace}
                    onChange={(runTrace) => this.setState({ runTrace })}
                  />
                </form>
              </DetailsPanelBody>
            </DetailsPanel>
          </DetailsBody>
        ) : null }

        { section === 'code' ? (
          <DetailsBody>
            <DetailsPanel data-test="action_code">
              <Highlight code={action} />
            </DetailsPanel>
          </DetailsBody>
        ) : null }

        { section === 'executions' ? (
          // TODO: redo in the likeness of Trigger's InstancePanel
          <DetailsBody>
            <DetailsToolbar key="toolbar">
              <Link className="st2-forms__button st2-forms__button--flat" to={`/history?action=${action.ref}`}>
                <i className="icon-history" /> See full action history
              </Link>
            </DetailsToolbar>
            <DetailsPanel key="panel" stick data-test="action_executions">
              <DetailsPanelBody>
                { executions.length > 0 ? (
                  <FlexTable>
                    { executions.map((execution) => ([
                      <FlexTableRow
                        key={execution.id}
                        onClick={() => this.handleToggleExecution(execution.id)}
                        columns={[]}
                      >
                        <FlexTableColumn fixed>
                          <i className={this.state.executionsVisible[execution.id] ? 'icon-chevron-down' : 'icon-chevron_right'} />
                        </FlexTableColumn>
                        <FlexTableColumn fixed>
                          <Label status={execution.status} short={true} />
                        </FlexTableColumn>
                        <FlexTableColumn>
                          <Time timestamp={execution.start_timestamp} />
                        </FlexTableColumn>
                        <Link
                          to={`/history/${execution.id}/general?action=${action.ref}`}
                          className='st2-actions__details-column-history'
                          title='Jump to History'
                        >
                          <i className="icon-history" />
                        </Link>
                      </FlexTableRow>,
                      <FlexTableInsert key={`${execution.id}-insert`} visible={this.state.executionsVisible[execution.id] || false}>
                        <ActionReporter runner={execution.runner.name} execution={execution} />
                      </FlexTableInsert>,
                    ])) }
                  </FlexTable>
                ) : (
                  <DetailsPanelEmpty>No history records for this action</DetailsPanelEmpty>
                ) }
              </DetailsPanelBody>
            </DetailsPanel>
          </DetailsBody>
        ) : null }

      </PanelDetails>
    );
  }
}
