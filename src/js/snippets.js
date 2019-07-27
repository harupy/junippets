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
  iplt: 'import matplotlib.pyplot as plt',
  ipl: [
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
  pdrc: 'pd.read_csv(${args})',
  pdtd: 'pd.to_datetime(${args})',
  pdcc: 'pd.concat(${args})',

  iloc: 'iloc[${args}]',
  vc: 'value_counts()',
  nuni: 'nunique()',
  sc: 'sort_values(${args})',
  gb: 'groupby(${args})',

  // sklearn metrics
  tts: 'X_train, X_test, y_train, y_test = train_test_split(${args})',

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

  // others
  rs: 'random_state=${seed}',
  af: 'ascending=${False}',
};

const replacePlaceholder = (body, ranges = []) => {
  const pattern = /\$\{([^{}]*)\}/;
  const match = body.match(pattern);
  if (!match) {
    return [body, ranges];
  } else {
    const [placeholder, defaultStr] = match;
    const head = cu.makeCursor(match.index, 0);
    const anchor = cu.withOffset(head, defaultStr.length);
    const newBody = body.replace(placeholder, defaultStr);
    return replacePlaceholder(newBody, [...ranges, { head, anchor }]);
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
    const body = Array.isArray(match) ? match.join('\n') : match;
    const selections = cm.listSelections();
    const rangesToReplace = selections.map(({ anchor, head }) => {
      const len = (prefix + ['', ...args].join(argSep)).length;
      return { anchor, head: { line: head.line, ch: head.ch - len } };
    });
    const [newBody, rangesToSelect] = replacePlaceholder(body);

    const newSelections = selections
      .map(sel => {
        return rangesToSelect.map(range => {
          const len = (prefix + ['', ...args].join(argSep)).length;
          const anchor = cu.withOffset(cu.mergeCursors(sel.anchor, range.anchor), -len);
          const head = cu.withOffset(cu.mergeCursors(sel.head, range.head), -len);
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
  const expandSnippetOrIndent = cm => !expandSnippet(cm);
  cm.options.extraKeys['Shift-Shift'] = expandSnippetOrIndent;
};
