import * as cu from './cursorUtils';

const snippets = {
  // ${...} represents the placeholder

  // import
  ios: 'import os',
  ire: 'import re',
  ijs: 'import json',
  ish: 'import shutil',
  igl: 'from glob import glob',
  idt: 'from datetime import datetime',
  itq: 'from tqdm import tqdm',
  ipd: 'import pandas as pd',
  inp: 'import numpy as np',
  plt: 'import matplotlib.pyplot as plt',
  plotly: [
    'import plotly.offline as py',
    'py.init_notebook_mode(connected=True)',
    'import plotly.graph_objs as go',
  ],
  isb: ['import seaborn as sns', 'sns.set()'],
  icv: 'import cv2',
  iwa: ['import warnings', "warnings.filterwarnings('ignore')"],

  // numpy
  npas: 'numpy.argsort(${args})',

  // pandas
  prc: 'pd.read_csv(${args})',
  ptd: 'pd.to_datetime(${args})',
  pcc: 'pd.concat(${args})',

  iloc: 'iloc[${args}]',
  vc: 'value_counts()',
  nu: 'nunique()',
  sv: 'sort_values(${args})',
  gb: 'groupby(${args})',

  // sklearn
  tts: 'X_train, X_test, y_train, y_test = train_test_split(${args})',
  kfold: [
    'from sklearn.model_selection import KFold',
    '',
    'kf = KFold(n_splits=${n_splits}, random_state=0)',
  ],
  skfold: [
    'from sklearn.model_selection import StratifiedKFold',
    '',
    'skf = StratifiedKFold(n_splits=${n_splits}, random_state=0)',
  ],

  // matplotlib
  title: 'plt.title(${args})',
  xlab: 'plt.xlabel(${args})',
  ylab: 'plt.ylabel(${args})',
  xti: 'plt.xtikcs(${args})',
  yti: 'plt.yticks(${args})',
  leg: 'plt.legend(${args})',
  show: 'plt.show()',

  // plotly
  gob: 'go.Bar(${args})',
  goh: 'go.Histogram(${args})',
  gos: 'go.Scatter(${args})',
  gol: 'go.Layout(${args})',
  gof: 'go.Figure(data=${data}, layout=layout)',
  ipp: 'py.iplot(fig)',

  // seaborn
  sdp: 'sns.distplot(${args})',
  sbp: 'sns.barplot(${args})',

  // others
  rs: 'random_state=${seed}',
  af: 'ascending=${False}',
};

const findPlaceholders = (body, ranges = []) => {
  const pattern = /\$\{([^{}]*)\}/m;
  const match = body.match(pattern);
  if (!match) {
    return [body, ranges];
  } else {
    const [placeholder, defaultStr] = match;
    const head = cu.makeCursor(match.index, 0);
    const anchor = cu.offsetCursor(head, defaultStr.length);
    const newBody = body.replace(placeholder, defaultStr);
    return findPlaceholders(newBody, [...ranges, { head, anchor }]);
  }
};

const escapeRegExp = string => {
  const reRegExpChar = /[\\^$.*+?()[\]{}|]/g;
  const reHasRegExpChar = RegExp(reRegExpChar.source);
  return string && reHasRegExpChar.test(string) ? string.replace(reRegExpChar, '\\$&') : string;
};

const argSep = '/';
const expandSnippet = cm => {
  const lineBeforeCursor = cu.getLineBeforeCursor(cm);
  const regex = new RegExp(`[^a-zA-Z0-9_]?([${escapeRegExp(argSep)}a-zA-Z0-9_,]+)$`);
  const match = lineBeforeCursor.match(regex);

  if (!match) {
    return false;
  }

  const text = match[1];
  const pieces = text.split(argSep);
  const prefix = pieces[0];
  const args = pieces.length > 1 ? pieces.slice(1) : [];

  if (prefix && prefix in snippets) {
    const match = snippets[prefix];
    const lines = Array.isArray(match) ? match : [match];
    const selections = cm.listSelections();
    const len = (prefix + ['', ...args].join(argSep)).length;

    const rangesToReplace = selections.map(({ anchor, head }) => {
      return { anchor, head: { line: head.line, ch: head.ch - len } };
    });

    const results = lines.map(line => findPlaceholders(line));
    const placeholderRanges = results
      .map((res, idx) => res[1].map(range => cu.offsetRange(range, 0, idx)))
      .flat();
    const newBody = results.map(res => res[0]).join('\n');

    const newSelections = selections
      .map((sel, idx) => {
        return placeholderRanges.map(range => {
          const anchorMerged = cu.mergeCursors(sel.anchor, range.anchor);
          const headMerged = cu.mergeCursors(sel.head, range.head);

          const lineOffset = idx * (lines.length - 1);
          const anchor = cu.offsetCursor(anchorMerged, -len, lineOffset);
          const head = cu.offsetCursor(headMerged, -len, lineOffset);
          return { anchor, head };
        });
      })
      .flat();

    cm.setSelections(rangesToReplace);
    cm.replaceSelections(Array(selections.length).fill(newBody));
    cm.setSelections(newSelections);
    if (args.length) {
      const replacement = args.map(arg => `'${arg}'`).join(', ');
      cm.replaceSelections(Array(selections.length).fill(replacement));
    }
    return true;
  } else {
    return false;
  }
};

export default cm => {
  // enable snippets
  cm.options.extraKeys['Alt'] = expandSnippet;
};
