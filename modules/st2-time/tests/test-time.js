import { expect } from 'chai';

import React from 'react';
import { ReactTester } from '@stackstorm/module-test-utils';

import Time from '..';

describe(`${Time.name} Component`, () => {
  describe('common functionality', () => {
    it('proxies className', () => {
      const instance = ReactTester.create(
        <Time
          className="foobar"
          timestamp={new Date().toJSON()}
        />
      );

      expect(instance.node.classList).to.contain('foobar');
    });

    it('proxies extra props', () => {
      const instance = ReactTester.create(
        <Time
          timestamp={new Date().toJSON()}
          foo="bar"
        />
      );

      expect(instance.node.props.foo).to.equal('bar');
    });
  });

  it('renders properly with defaults', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
      />
    );

    // note: this will only work in places with whole hour offsets
    const hour = (24 - new Date().getTimezoneOffset() / 60);
    if (hour >= 24) {
      expect(instance.text).to.equal(
        `Thu, 01 Jan 1970 ${(hour - 24).toFixed(0).padStart(2, '0')}:00:00`
      );
    }
    else {
      expect(instance.text).to.equal(`Wed, 31 Dec 1969 ${hour.toFixed(0).padStart(2, '0')}:00:00`);
    }
  });

  it('renders properly with utc', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        utc={true}
      />
    );

    expect(instance.text).to.equal('Thu, 01 Jan 1970 00:00:00 UTC');
  });

  it('renders properly with format', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        format="MMMM D YYYY HH:mm A"
      />
    );

    // note: this will only work in places with whole hour offsets
    const hour = (24 - new Date().getTimezoneOffset() / 60);
    if (hour >= 24) {
      expect(instance.text).to.equal(
        `January 1 1970 ${(hour - 24).toFixed(0).padStart(2, '0')}:00 AM`
      );
    }
    else {
      expect(instance.text).to.equal(`December 31 1969 ${hour.toFixed(0).padStart(2, '0')}:00 PM`);
    }
  });

  it('renders properly with format and utc', () => {
    const instance = ReactTester.create(
      <Time
        timestamp="1970-01-01T00:00:00.000Z"
        format="MMMM D YYYY HH:mm A"
        utc={true}
      />
    );

    expect(instance.text).to.equal('January 1 1970 00:00 AM UTC');
  });
});
