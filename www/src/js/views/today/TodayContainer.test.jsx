// @flow

import React from 'react';
import { flatten } from 'lodash';
import { shallow } from 'enzyme';
import * as weather from 'apis/weather';
import Raven from 'raven-js';
import { waitFor } from 'test-utils/async';
import { TodayContainerComponent } from './TodayContainer';
import DayHeader from './DayHeader';
import DayEvents from './DayEvents';
import styles from './TodayContainer.scss';

const COLORS = {
  CS3216: 1,
  CS1010S: 2,
  PC1222: 3,
};

const CS3216_LESSONS = {
  Lecture: [
    {
      ModuleCode: 'CS3216',
      ModuleTitle: 'Software Product Engineering for Digital Markets',
      ClassNo: '1',
      LessonType: 'Lecture',
      WeekText: 'Every Week',
      DayText: 'Monday',
      StartTime: '1830',
      EndTime: '2030',
      Venue: 'VCRm',
    },
  ],
};

const CS1010S_LESSONS = {
  Recitation: [
    {
      ModuleCode: 'CS1010S',
      ModuleTitle: 'Programming Methodology',
      ClassNo: '9',
      LessonType: 'Recitation',
      WeekText: 'Every Week',
      DayText: 'Thursday',
      StartTime: '1100',
      EndTime: '1200',
      Venue: 'i3-0344',
    },
  ],
};

const PC1222_LESSONS = {
  Laboratory: [
    {
      ModuleCode: 'PC1222',
      ModuleTitle: 'Fundamentals of Physics II',
      ClassNo: 'U02',
      LessonType: 'Laboratory',
      WeekText: 'Even Week',
      DayText: 'Tuesday',
      StartTime: '1400',
      EndTime: '1700',
      Venue: 'S12-0402',
    },
  ],
  Tutorial: [
    {
      ModuleCode: 'PC1222',
      ModuleTitle: 'Fundamentals of Physics II',
      ClassNo: 'T11',
      LessonType: 'Tutorial',
      WeekText: 'Every Week',
      DayText: 'Wednesday',
      StartTime: '0900',
      EndTime: '1000',
      Venue: 'CQT/SR0315',
    },
  ],
  Lecture: [
    {
      ModuleCode: 'PC1222',
      ModuleTitle: 'Fundamentals of Physics II',
      ClassNo: 'SL1',
      LessonType: 'Lecture',
      WeekText: 'Every Week',
      DayText: 'Tuesday',
      StartTime: '1200',
      EndTime: '1400',
      Venue: 'LT25',
    },
    {
      ModuleCode: 'PC1222',
      ModuleTitle: 'Fundamentals of Physics II',
      ClassNo: 'SL1',
      LessonType: 'Lecture',
      WeekText: 'Every Week',
      DayText: 'Friday',
      StartTime: '1200',
      EndTime: '1400',
      Venue: 'LT25',
    },
  ],
};

const LESSONS = {
  CS3216: CS3216_LESSONS,
  CS1010S: CS1010S_LESSONS,
  PC1222: PC1222_LESSONS,
};

jest.mock('apis/weather');

// Mock axios to stop it from firing API requests
beforeEach(() => {
  jest.spyOn(Raven, 'captureException').mockImplementation(() => {});
});

afterEach(() => {
  Raven.captureException.mockRestore();
});

//     August 2016            September 2016         October 2016
// Wk Mo Tu We Th Fr Sa | Wk Mo Tu We Th Fr Sa | Wk Mo Tu We Th Fr Sa
//     2  3  4  5  6    | 04        1  2  3    | 07                 1
// 01  8  9 10 11 12 13 | 05  5  6  7  8  9 10 | 08  3  4  5  6  7  8
// 02 15 16 17 18 19 20 | 06 12 13 14 15 16 17 | 09 10 11 12 13 14 15
// 03 22 23 24 25 26 27 | Re 19 20 21 22 23 24 | 10 17 18 19 20 21 22
// 04 29 30 31          | 07 26 27 28 29 30    | 11 24 25 26 27 28 29
//                      |                      | 12 31
//
//     November 2016    |
// Wk Mo Tu We Th Fr Sa |
// 12     1  2  3  4  5 |
// 13  7  8  9 10 11 12 |
// Re 14 15 16 17 18 19 |
// E1 21 22 23 24 25 26 |
// E2 28 29 30          |
describe(TodayContainerComponent, () => {
  const getLessons = (wrapper) => {
    const days = wrapper.find(DayEvents);
    const cards = days.map((w) => w.shallow().find(`.${styles.lesson} h4`));
    const titles = cards.map((c) => c.map((h) => h.text()));

    return flatten(titles);
  };

  test('should render', () => {
    // Monday, 8th August 2016, 0800 - week 4
    const now = new Date('2016-08-08T00:00:00.000Z');

    const wrapper = shallow(
      <TodayContainerComponent currentTime={now} timetableWithLessons={{}} colors={COLORS} />,
    );

    expect(wrapper.find(DayHeader).map((w) => w.prop('dayName'))).toEqual([
      'Today',
      'Tomorrow',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ]);
    expect(getLessons(wrapper)).toHaveLength(0);
    expect(wrapper.text().match(/You have no lessons today/gi)).toHaveLength(5);
  });

  test('should render lessons on a normal week', () => {
    // Monday, 29th August 2016, 0800 - week 4
    const now = new Date('2016-08-29T00:00:00.000Z');

    const wrapper = shallow(
      <TodayContainerComponent currentTime={now} timetableWithLessons={LESSONS} colors={COLORS} />,
    );

    expect(wrapper.find(DayHeader)).toHaveLength(7);
    expect(getLessons(wrapper)).toHaveLength(6);
  });

  test('should not render even week lessons on odd weeks', () => {
    // Monday, 22th August 2016, 0800 - week 3
    const now = new Date('2016-08-22T00:00:00.000Z');

    const wrapper = shallow(
      <TodayContainerComponent currentTime={now} timetableWithLessons={LESSONS} colors={COLORS} />,
    );

    expect(getLessons(wrapper)).toHaveLength(5);
  });

  test('should capture exception when weather API fails to load', async () => {
    // $FlowFixMe
    weather.fourDay.mockRejectedValueOnce(new Error('Cannot load weather'));

    const now = new Date('2016-08-22T00:00:00.000Z');

    shallow(
      <TodayContainerComponent currentTime={now} timetableWithLessons={LESSONS} colors={COLORS} />,
    );

    expect(weather.twoHour).toBeCalled();
    expect(weather.tomorrow).toBeCalled();
    expect(weather.fourDay).toBeCalled();

    await waitFor(() => Raven.captureException.mock.calls.length > 0);

    expect(Raven.captureException).toBeCalled();
  });
});
